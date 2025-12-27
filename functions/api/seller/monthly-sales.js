export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB; // D1 database binding

        // Check if database is available
        if (!db) {
            return new Response('Database not available', { status: 500 });
        }

        // Handle GET request - fetch monthly sales data
        if (request.method === 'GET') {
            // Get sellerId from session cookie
            let sellerId = null;
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
                        sellerId = sessionData.userId || null;
                    }
                }
            } catch (e) {
                console.log('Could not extract sellerId from session:', e);
            }

            if (!sellerId) {
                return new Response(
                    JSON.stringify({ error: 'Not authenticated' }),
                    {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Get current year
            const currentYear = new Date().getFullYear();

            // Query to get monthly sales totals for the current year
            // SQLite strftime('%m', date) returns month as 01-12
            let results = [];
            try {
                const query = `
                    SELECT 
                        strftime('%m', created_at) as month,
                        SUM(amount) as total
                    FROM sales
                    WHERE sellerId = ? 
                        AND status = 'completed'
                        AND strftime('%Y', created_at) = ?
                    GROUP BY strftime('%m', created_at)
                    ORDER BY month ASC
                `;

                const queryResult = await db.prepare(query)
                    .bind(sellerId, currentYear.toString())
                    .all();
                results = queryResult.results || [];
            } catch (e) {
                console.error('Error fetching monthly sales:', e);
                // Return empty array instead of failing
                results = [];
            }

            return new Response(
                JSON.stringify({
                    success: true,
                    monthlyData: results || [],
                    year: currentYear
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
        console.error('Monthly sales API error:', error);
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

