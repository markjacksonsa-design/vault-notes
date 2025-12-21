export async function onRequest(context) {
    try {
        const { request, env } = context;
        const db = env.DB; // D1 database binding
        const bucket = env.BUCKET; // R2 bucket binding
        const paystackSecret = env.PAYSTACK_SECRET; // Paystack secret key

        // Check if required bindings are available
        if (!db) {
            return new Response('Database not available', { status: 500 });
        }
        if (!bucket) {
            return new Response('Storage bucket not available', { status: 500 });
        }
        if (!paystackSecret) {
            return new Response('Paystack secret key not configured', { status: 500 });
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
                        headers: { 'Content-Type': 'application/json' }
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
                        headers: { 'Content-Type': 'application/json' }
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
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Fetch note details to get PDF key from D1 database
            const note = await db.prepare("SELECT pdf_key, title FROM notes WHERE id = ?")
                .bind(noteId)
                .first();

            if (!note) {
                return new Response(
                    JSON.stringify({ error: 'Note not found' }),
                    {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            if (!note.pdf_key) {
                return new Response(
                    JSON.stringify({ error: 'No PDF file available for this note' }),
                    {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
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
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Generate secure download URL
            // Using our download endpoint that verifies the payment reference
            // This is more secure than presigned URLs as we can verify payment on each download
            const downloadUrl = `/api/download?noteId=${noteId}&reference=${reference}`;

            // Return success with secure download link
            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Payment verified successfully',
                    downloadUrl: downloadUrl,
                    reference: reference,
                    pdfKey: note.pdf_key // Include for reference (not used client-side for security)
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
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
                    'Allow': 'POST'
                }
            }
        );

    } catch (error) {
        console.error('Payment verification error:', error);
        return new Response(
            JSON.stringify({ 
                error: 'Internal server error', 
                message: error.message 
            }),
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

