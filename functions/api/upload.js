export async function onRequest(context) {
    try {
        const { request } = context;
        const bucket = context.env.BUCKET; // R2 bucket binding

        // Basic error handling - check if bucket is available
        if (!bucket) {
            return new Response('Storage bucket not available', { status: 500 });
        }
        // Handle POST request - upload PDF or image file
        if (request.method === 'POST') {
            const formData = await request.formData();
            const file = formData.get('file');
            const fileType = formData.get('type') || 'pdf'; // 'pdf' or 'thumbnail'

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

            // Determine file type and validate
            const isImage = file.type.startsWith('image/');
            const isPDF = file.type === 'application/pdf';
            
            if (!isPDF && !isImage) {
                return new Response(
                    JSON.stringify({ error: 'Only PDF and image files are allowed' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Generate unique filename using timestamp and random string
            const timestamp = Date.now();
            const randomStr = Math.random().toString(36).substring(2, 15);
            const originalName = file.name || (isImage ? 'image.jpg' : 'document.pdf');
            const fileExtension = originalName.split('.').pop() || (isImage ? 'jpg' : 'pdf');
            
            // Determine folder based on file type
            const folder = (fileType === 'thumbnail' || isImage) ? 'thumbnails' : 'notes';
            const uniqueKey = `${folder}/${timestamp}-${randomStr}.${fileExtension}`;

            // Convert file to array buffer
            const arrayBuffer = await file.arrayBuffer();

            // Upload to R2 bucket
            await bucket.put(uniqueKey, arrayBuffer, {
                httpMetadata: {
                    contentType: file.type || (isImage ? 'image/jpeg' : 'application/pdf'),
                },
                customMetadata: {
                    originalName: originalName,
                    uploadedAt: new Date().toISOString(),
                    fileType: isImage ? 'thumbnail' : 'pdf',
                },
            });

            // Return the key/filename (only filename, not full URL)
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

