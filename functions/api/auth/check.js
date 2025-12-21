export async function onRequest(context) {
    try {
        const { request, env } = context;
        
        // Get session cookie
        const cookieHeader = request.headers.get('Cookie');
        if (!cookieHeader) {
            return new Response(
                JSON.stringify({ authenticated: false }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Parse cookies
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {});

        const sessionCookie = cookies.session;
        if (!sessionCookie) {
            return new Response(
                JSON.stringify({ authenticated: false }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        try {
            // Decode session data (works in Cloudflare Workers)
            const decoded = atob(sessionCookie);
            const sessionData = JSON.parse(decoded);
            
            return new Response(
                JSON.stringify({
                    authenticated: true,
                    user: {
                        id: sessionData.userId,
                        name: sessionData.name,
                        email: sessionData.email
                    }
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        } catch (e) {
            return new Response(
                JSON.stringify({ authenticated: false }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

    } catch (error) {
        console.error('Auth check error:', error);
        return new Response(
            JSON.stringify({ authenticated: false }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

