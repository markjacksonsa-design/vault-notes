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
                    s.customer_email,
                    s.amount,
                    s.reference,
                    s.created_at,
                    n.title as note_title
                FROM sales s
                LEFT JOIN notes n ON s.noteId = n.id
                ORDER BY s.created_at DESC
            `;

            const { results } = await db.prepare(query).all();

            // Calculate total revenue
            const totalRevenueResult = await db.prepare("SELECT SUM(amount) as total FROM sales").first();
            const totalRevenue = totalRevenueResult?.total || 0;

            // Return sales data with total revenue
            return new Response(
                JSON.stringify({
                    success: true,
                    sales: results || [],
                    totalRevenue: parseFloat(totalRevenue).toFixed(2),
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

