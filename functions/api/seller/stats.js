export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB; // D1 database binding

        // Check if database is available
        if (!db) {
            return new Response('Database not available', { status: 500 });
        }

        // Handle GET request - fetch seller statistics
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

            // Get total earnings from completed sales for this seller
            // SUM returns NULL when there are no rows, so we handle that explicitly
            let totalEarnings = 0;
            try {
                const earningsResult = await db.prepare(
                    "SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE sellerId = ? AND status = 'completed'"
                )
                    .bind(sellerId)
                    .first();
                totalEarnings = earningsResult?.total ?? 0;
            } catch (e) {
                console.error('Error fetching total earnings:', e);
                totalEarnings = 0;
            }

            // Get total downloads (count of completed sales)
            let totalDownloads = 0;
            try {
                const downloadsResult = await db.prepare(
                    "SELECT COUNT(*) as count FROM sales WHERE sellerId = ? AND status = 'completed'"
                )
                    .bind(sellerId)
                    .first();
                totalDownloads = downloadsResult?.count || 0;
            } catch (e) {
                console.error('Error fetching total downloads:', e);
                totalDownloads = 0;
            }

            // Get active listings (notes with price > 0 or with completed sales)
            let activeListings = 0;
            try {
                const activeListingsResult = await db.prepare(`
                    SELECT COUNT(DISTINCT n.id) as count
                    FROM notes n
                    LEFT JOIN sales s ON n.id = s.noteId AND s.sellerId = ? AND s.status = 'completed'
                    WHERE n.seller_id = ? AND (n.price > 0 OR s.id IS NOT NULL)
                `)
                    .bind(sellerId, sellerId)
                    .first();
                activeListings = activeListingsResult?.count || 0;
            } catch (e) {
                console.error('Error fetching active listings:', e);
                activeListings = 0;
            }

            // Recalculate reputation to ensure it's up-to-date
            // Formula: (Sales * 2) + (Vouches * 10)
            let reputationPoints = 0;
            let tier = 'Candidate';
            try {
                const { calculateUserReputation } = await import('../../utils/reputation.js');
                const reputationData = await calculateUserReputation(db, sellerId);
                reputationPoints = reputationData.reputationPoints || 0;
                tier = reputationData.tier || 'Candidate';
            } catch (e) {
                console.error('Error recalculating reputation:', e);
                // Fallback: try to get from database
                try {
                    const userResult = await db.prepare(
                        "SELECT reputation_points, tier FROM users WHERE id = ?"
                    )
                        .bind(sellerId)
                        .first();
                    reputationPoints = userResult?.reputation_points || 0;
                    tier = userResult?.tier || 'Candidate';
                } catch (dbError) {
                    console.error('Error fetching reputation from database:', dbError);
                    reputationPoints = 0;
                    tier = 'Candidate';
                }
            }

            // Return statistics
            return new Response(
                JSON.stringify({
                    success: true,
                    totalEarnings: totalEarnings,
                    totalDownloads: totalDownloads,
                    activeListings: activeListings,
                    reputationPoints: reputationPoints,
                    tier: tier
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
        console.error('Seller stats API error:', error);
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

