export async function onRequest(context) {
    const { request, env } = context;
    const db = env.DB; // D1 database binding

    // Basic error handling - check if database is available
    if (!db) {
        return new Response(
            JSON.stringify({ error: 'Database not available' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    try {
        // Handle GET request - fetch statistics
        if (request.method === 'GET') {
            // Get total number of notes
            const countResult = await db.prepare("SELECT COUNT(*) as count FROM notes").first();
            const totalNotes = countResult?.count || 0;

            // Get sum of all prices
            const sumResult = await db.prepare("SELECT SUM(price) as total_earnings FROM notes").first();
            const totalEarnings = sumResult?.total_earnings || 0;

            // Calculate average price
            const averagePrice = totalNotes > 0 ? (totalEarnings / totalNotes) : 0;

            return new Response(
                JSON.stringify({
                    totalNotes: totalNotes,
                    totalEarnings: totalEarnings,
                    averagePrice: averagePrice
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
        // Error handling for database operations
        console.error('Database error:', error);
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

