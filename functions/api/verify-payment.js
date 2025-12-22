export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB; // D1 database binding
        const bucket = context.env.BUCKET; // R2 bucket binding
        const paystackSecret = context.env.PAYSTACK_SECRET; // Paystack secret key

        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        // Get origin from request
        const origin = request.headers.get('Origin') || '';
        // Allow requests from your custom domain
        const allowedOrigins = [
            'https://notevault.co.za',
            'https://www.notevault.co.za',
        ];
        const isAllowedOrigin = allowedOrigins.some(allowed => origin.includes(allowed)) || !origin;
        const corsHeaders = {
            'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Check if required bindings are available
        if (!db) {
            return new Response('Database not available', { 
                status: 500,
                headers: corsHeaders
            });
        }
        if (!bucket) {
            return new Response('Storage bucket not available', { 
                status: 500,
                headers: corsHeaders
            });
        }
        if (!paystackSecret) {
            return new Response('Paystack secret key not configured', { 
                status: 500,
                headers: corsHeaders
            });
        }

        // Handle POST request - verify payment
        if (request.method === 'POST') {
            const { reference, noteId } = await request.json();

            // Validate required fields
            if (!reference || !noteId) {
                return new Response(
                    JSON.stringify({ error: 'Missing reference or noteId' }),
                    {
                        status: 400,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            // Verify payment with Paystack
            const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${paystackSecret}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!paystackResponse.ok) {
                const errorData = await paystackResponse.json();
                return new Response(
                    JSON.stringify({ 
                        error: 'Payment verification failed', 
                        details: errorData.message || 'Unknown error' 
                    }),
                    {
                        status: 400,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            const paystackData = await paystackResponse.json();

            // Check if payment was successful
            if (paystackData.status !== true || paystackData.data.status !== 'success') {
                return new Response(
                    JSON.stringify({ 
                        error: 'Payment verification failed', 
                        details: 'Transaction was not successful' 
                    }),
                    {
                        status: 400,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            // Extract payment details from Paystack response
            const customerEmail = paystackData.data.customer?.email || paystackData.data.authorization?.email || '';
            const amount = paystackData.data.amount ? (paystackData.data.amount / 100) : 0; // Convert from kobo to ZAR

            // Get user_id from session cookie if available
            let userId = null;
            try {
                const cookieHeader = request.headers.get('Cookie');
                if (cookieHeader) {
                    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
                        const [key, value] = cookie.trim().split('=');
                        acc[key] = value;
                        return acc;
                    }, {});
                    
                    const sessionCookie = cookies.session;
                    if (sessionCookie) {
                        try {
                            const decoded = atob(sessionCookie);
                            const sessionData = JSON.parse(decoded);
                            userId = sessionData.userId || null;
                        } catch (e) {
                            console.log('Error parsing session cookie:', e);
                        }
                    }
                }
            } catch (e) {
                console.log('Could not extract user_id from session:', e);
            }

            // Fetch note details to get PDF key, title, and seller_id from D1 database
            const note = await db.prepare("SELECT pdf_key, title, seller_id FROM notes WHERE id = ?")
                .bind(noteId)
                .first();

            if (!note) {
                return new Response(
                    JSON.stringify({ error: 'Note not found' }),
                    {
                        status: 404,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            // Get seller_id from note
            const sellerId = note.seller_id || null;

            // Check if this reference has already been logged (prevent double-logging)
            const existingSale = await db.prepare("SELECT id FROM sales WHERE reference = ?")
                .bind(reference)
                .first();

            if (existingSale) {
                // Reference already logged - update with buyer_id, seller_id, note_id if missing
                if (userId || sellerId) {
                    try {
                        const updateFields = [];
                        const updateValues = [];
                        
                        if (userId) {
                            updateFields.push('buyer_id = ?');
                            updateValues.push(userId);
                        }
                        if (sellerId) {
                            updateFields.push('seller_id = ?');
                            updateValues.push(sellerId);
                        }
                        if (noteId) {
                            updateFields.push('note_id = ?');
                            updateValues.push(noteId);
                        }
                        
                        if (updateFields.length > 0) {
                            updateValues.push(reference);
                            await db.prepare(
                                `UPDATE sales SET ${updateFields.join(', ')} WHERE reference = ?`
                            )
                                .bind(...updateValues)
                                .run();
                            console.log(`Updated sale ${reference} with buyer_id, seller_id, note_id`);
                        }
                    } catch (updateError) {
                        console.log('Could not update sale:', updateError);
                    }
                }
                console.log(`Sale with reference ${reference} already logged`);
            } else {
                // Log the successful purchase to sales table with buyer_id, seller_id, and note_id
                try {
                    const insertResult = await db.prepare(
                        "INSERT INTO sales (note_id, buyer_id, seller_id, customer_email, amount, reference, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
                    )
                        .bind(noteId, userId, sellerId, customerEmail, amount, reference, new Date().toISOString())
                        .run();

                    if (insertResult.success) {
                        console.log(`Sale logged successfully: Reference ${reference}, Note ${noteId}, Buyer ${userId}, Seller ${sellerId}, Amount R${amount}, Email ${customerEmail}`);
                    } else {
                        console.error(`Failed to log sale: Reference ${reference}`);
                    }
                } catch (insertError) {
                    // Log error but don't fail the payment verification
                    console.error('Error logging sale to database:', insertError);
                    // If table doesn't exist, log a warning
                    if (insertError.message && insertError.message.includes('no such table')) {
                        console.warn('Sales table does not exist. Please create it with: CREATE TABLE sales (id INTEGER PRIMARY KEY AUTOINCREMENT, note_id TEXT NOT NULL, buyer_id INTEGER, seller_id INTEGER, customer_email TEXT NOT NULL, amount REAL NOT NULL, reference TEXT UNIQUE NOT NULL, created_at TEXT NOT NULL)');
                    }
                }
            }

            if (!note.pdf_key) {
                return new Response(
                    JSON.stringify({ error: 'No PDF file available for this note' }),
                    {
                        status: 404,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            // Verify the PDF exists in R2 bucket
            const pdfObject = await bucket.head(note.pdf_key);
            if (!pdfObject) {
                return new Response(
                    JSON.stringify({ error: 'PDF file not found in storage' }),
                    {
                        status: 404,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            // Generate secure download URL
            // Using our download endpoint that verifies the payment reference
            // This is more secure than presigned URLs as we can verify payment on each download
            const downloadUrl = `/api/download?noteId=${noteId}&reference=${reference}`;

            // Return success with secure download link and personalized data
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Payment verified successfully',
                    downloadUrl: downloadUrl,
                    reference: reference,
                    noteTitle: note.title || 'Untitled Note',
                    customerEmail: customerEmail,
                    amount: amount
                }),
                {
                    status: 200,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                }
            );
        }

        // Handle unsupported methods
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { 
                    'Content-Type': 'application/json',
                    'Allow': 'POST',
                    ...corsHeaders
                }
            }
        );

    } catch (error) {
        console.error('Payment verification error:', error);
        // Get origin for CORS headers (fallback if request is not available)
        const origin = context?.request?.headers?.get('Origin') || '';
        const allowedOrigins = [
            'https://notevault.co.za',
            'https://www.notevault.co.za',
        ];
        const isAllowedOrigin = allowedOrigins.some(allowed => origin.includes(allowed)) || !origin;
        const corsHeaders = {
            'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        return new Response(
            JSON.stringify({ 
                error: 'Internal server error', 
                message: error.message 
            }),
            { 
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            }
        );
    }
}


