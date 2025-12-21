export async function onRequest(context) {
    try {
        const { request, env } = context;
        const db = env.DB; // D1 database binding
        const bucket = env.BUCKET; // R2 bucket binding
        const paystackSecret = env.PAYSTACK_SECRET; // Paystack secret key

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

            // Handle free downloads (reference === 'free')
            if (reference !== 'free') {
                // Verify payment with Paystack (double-check)
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

