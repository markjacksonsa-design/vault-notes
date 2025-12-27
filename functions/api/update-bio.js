export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB;

        if (!db) {
            return new Response('Database not available', { status: 500 });
        }

        // Handle POST request - update user bio
        if (request.method === 'POST') {
            // Get userId from session cookie
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
                console.log('Could not extract userId from session:', e);
            }

            if (!userId) {
                return new Response(
                    JSON.stringify({ error: 'Not authenticated' }),
                    {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Parse request body
            const body = await request.json();
            const bio = body.bio || '';

            // Update bio in database
            try {
                await db.prepare(
                    "UPDATE users SET bio = ? WHERE id = ?"
                )
                    .bind(bio, userId)
                    .run();

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'Bio updated successfully'
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            } catch (e) {
                console.error('Error updating bio:', e);
                return new Response(
                    JSON.stringify({ error: 'Failed to update bio' }),
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }
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
        console.error('Update bio API error:', error);
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

