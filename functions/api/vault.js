export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB; // D1 database binding

        // Check if database is available
        if (!db) {
            return new Response('Database not available', { status: 500 });
        }

        // Handle GET request - fetch user's purchased notes (vault)
        if (request.method === 'GET') {
            // Get user_id from session cookie
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

            if (!userId) {
                return new Response(
                    JSON.stringify({ error: 'Not authenticated' }),
                    {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Fetch user's purchases with note details
            const query = `
                SELECT 
                    s.id as sale_id,
                    s.noteId,
                    s.paystackRef as reference,
                    s.amount,
                    s.status,
                    s.is_vouched,
                    s.created_at as purchase_date,
                    n.title as note_title,
                    n.subject,
                    n.curriculum,
                    n.level,
                    n.pdf_key
                FROM sales s
                LEFT JOIN notes n ON s.noteId = n.id
                WHERE s.buyerId = ?
                ORDER BY s.created_at DESC
            `;

            const { results } = await db.prepare(query).bind(userId).all();

            return new Response(
                JSON.stringify({
                    success: true,
                    purchases: results || [],
                    count: results?.length || 0
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
                    'Allow': 'GET'
                }
            }
        );

    } catch (error) {
        console.error('Vault API error:', error);
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

