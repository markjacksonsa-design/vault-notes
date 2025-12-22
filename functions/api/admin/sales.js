export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB; // D1 database binding

        // Check if database is available
        if (!db) {
            return new Response('Database not available', { status: 500 });
        }

        // Handle GET request - fetch all sales
        if (request.method === 'GET') {
            // Join sales with notes table to get note titles
            const query = `
                SELECT 
                    s.id,
                    s.noteId,
                    s.buyerId,
                    s.sellerId,
                    s.amount,
                    s.status,
                    s.paystackRef,
                    s.created_at,
                    n.title as note_title
                FROM sales s
                LEFT JOIN notes n ON s.noteId = n.id
                ORDER BY s.created_at DESC
            `;

            const { results } = await db.prepare(query).all();

            // Return sales data
            return new Response(
                JSON.stringify({
                    success: true,
                    sales: results || [],
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
        console.error('Sales API error:', error);
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

