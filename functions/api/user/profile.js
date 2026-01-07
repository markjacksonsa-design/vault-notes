export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB;

        if (!db) {
            return new Response(JSON.stringify({ error: 'Database not available' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Handle GET request - get user profile
        if (request.method === 'GET') {
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

            // Fetch user data
            try {
                const user = await db.prepare(
                    "SELECT id, email, name, firstName, lastName, school, bio, bank_name, account_number, subaccount_code FROM users WHERE id = ?"
                )
                    .bind(userId)
                    .first();

                if (!user) {
                    return new Response(
                        JSON.stringify({ error: 'User not found' }),
                        {
                            status: 404,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }

                return new Response(
                    JSON.stringify({
                        success: true,
                        user: user
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            } catch (e) {
                console.error('Error fetching user profile:', e);
                return new Response(
                    JSON.stringify({ error: 'Failed to fetch user profile' }),
                    {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }
        }

        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { 
                    'Content-Type': 'application/json',
                    'Allow': 'GET'
                }
            }
        );
    } catch (error) {
        console.error('User profile API error:', error);
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

