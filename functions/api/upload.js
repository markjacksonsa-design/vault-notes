export async function onRequest(context) {
    try {
        const { request, env } = context;
        const bucket = env.BUCKET; // R2 bucket binding

        // Basic error handling - check if bucket is available
        if (!bucket) {
            return new Response('Storage bucket not available', { status: 500 });
        }
        // Handle POST request - upload PDF file
        if (request.method === 'POST') {
            const formData = await request.formData();
            const file = formData.get('file');

            // Validate file exists
            if (!file) {
                return new Response(
                    JSON.stringify({ error: 'No file provided' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Validate file type is PDF
            if (file.type !== 'application/pdf') {
                return new Response(
                    JSON.stringify({ error: 'Only PDF files are allowed' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Generate unique filename using timestamp and random string
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 15);
            const originalName = file.name || 'document.pdf';
            const fileExtension = originalName.split('.').pop() || 'pdf';
            const uniqueKey = `notes/${timestamp}-${randomStr}.${fileExtension}`;

            // Convert file to array buffer
            const arrayBuffer = await file.arrayBuffer();

            // Upload to R2 bucket
            await bucket.put(uniqueKey, arrayBuffer, {
                httpMetadata: {
                    contentType: 'application/pdf',
                },
                customMetadata: {
                    originalName: originalName,
                    uploadedAt: new Date().toISOString(),
                },
            });

            // Return the key/filename
            return new Response(
                JSON.stringify({
                    success: true,
                    key: uniqueKey,
                    filename: uniqueKey,
                    message: 'File uploaded successfully'
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
        // Error handling - return actual error message
        console.error('Upload error:', error);
        return new Response(error.message || 'Internal server error', { status: 500 });
    }
}

