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

        // Handle POST request - update user profile
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

            // Get profile data from request body
            const { firstName, lastName, school, bio } = await request.json();

            // Update user profile
            try {
                // Build update query dynamically based on provided fields
                const updates = [];
                const bindings = [];

                if (firstName !== undefined) {
                    updates.push('firstName = ?');
                    bindings.push(firstName);
                }
                if (lastName !== undefined) {
                    updates.push('lastName = ?');
                    bindings.push(lastName);
                }
                if (school !== undefined) {
                    updates.push('school = ?');
                    bindings.push(school);
                }
                if (bio !== undefined) {
                    updates.push('bio = ?');
                    bindings.push(bio);
                }

                if (updates.length === 0) {
                    return new Response(
                        JSON.stringify({ error: 'No fields to update' }),
                        {
                            status: 400,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }

                bindings.push(userId);
                const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
                
                await db.prepare(query).bind(...bindings).run();

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'Profile updated successfully'
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            } catch (e) {
                console.error('Error updating user profile:', e);
                return new Response(
                    JSON.stringify({ error: 'Failed to update profile', details: e.message }),
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
                    'Allow': 'POST'
                }
            }
        );
    } catch (error) {
        console.error('Update profile API error:', error);
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

