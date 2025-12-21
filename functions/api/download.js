export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB; // D1 database binding
        const bucket = context.env.BUCKET; // R2 bucket binding
        const paystackSecret = context.env.PAYSTACK_SECRET; // Paystack secret key

        // Check if required bindings are available
        if (!db || !bucket || !paystackSecret) {
            return new Response('Service unavailable', { status: 500 });
        }

        // Handle GET request - download PDF
        if (request.method === 'GET') {
            const url = new URL(request.url);
            const noteId = url.searchParams.get('noteId');
            const reference = url.searchParams.get('reference');

            // Validate required parameters
            if (!noteId || !reference) {
                return new Response('Missing noteId or reference', { status: 400 });
            }

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
                        const decoded = atob(sessionCookie);
                        const sessionData = JSON.parse(decoded);
                        userId = sessionData.userId || null;
                    }
                }
            } catch (e) {
                console.log('Could not extract user_id from session:', e);
            }

            // Handle free downloads (reference === 'free')
            if (reference !== 'free') {
                // Verify that user has a recorded sale for this note
                if (userId) {
                    const sale = await db.prepare(
                        "SELECT id FROM sales WHERE user_id = ? AND noteId = ? AND reference = ?"
                    )
                        .bind(userId, noteId, reference)
                        .first();

                    if (!sale) {
                        return new Response('Purchase not found. You must have a recorded sale to download this note.', { status: 403 });
                    }
                } else {
                    // If no user session, verify payment with Paystack (fallback)
                    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${paystackSecret}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (!paystackResponse.ok) {
                        return new Response('Payment verification failed', { status: 403 });
                    }

                    const paystackData = await paystackResponse.json();

                    // Check if payment was successful
                    if (paystackData.status !== true || paystackData.data.status !== 'success') {
                        return new Response('Payment not verified', { status: 403 });
                    }
                }
            }

            // Fetch note details to get PDF key
            const note = await db.prepare("SELECT pdf_key, title FROM notes WHERE id = ?")
                .bind(noteId)
                .first();

            if (!note || !note.pdf_key) {
                return new Response('Note or PDF not found', { status: 404 });
            }

            // Get PDF from R2 bucket
            const pdfObject = await bucket.get(note.pdf_key);

            if (!pdfObject) {
                return new Response('PDF file not found in storage', { status: 404 });
            }

            // Stream the PDF file
            const pdfData = await pdfObject.arrayBuffer();
            const filename = (note.title || 'note') + '.pdf';

            return new Response(pdfData, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                }
            });
        }

        // Handle unsupported methods
        return new Response('Method not allowed', { status: 405 });

    } catch (error) {
        console.error('Download error:', error);
        return new Response('Internal server error', { status: 500 });
    }
}

