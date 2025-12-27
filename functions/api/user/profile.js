export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB; // D1 database binding

        // Check if database is available
        if (!db) {
            return new Response('Database not available', { status: 500 });
        }

        // Handle GET request - fetch user profile
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

            // Get user profile data
            const userResult = await db.prepare(
                "SELECT id, name, email, created_at, reputation_points, tier FROM users WHERE id = ?"
            )
                .bind(userId)
                .first();

            if (!userResult) {
                return new Response(
                    JSON.stringify({ error: 'User not found' }),
                    {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Get total notes uploaded by this user
            let totalNotes = 0;
            try {
                const notesResult = await db.prepare(
                    "SELECT COUNT(*) as count FROM notes WHERE seller_id = ?"
                )
                    .bind(userId)
                    .first();
                totalNotes = notesResult?.count || 0;
            } catch (e) {
                console.error('Error fetching total notes:', e);
                totalNotes = 0;
            }

            // Get total vouches received (sales where is_vouched = 1 for this seller)
            let totalVouches = 0;
            try {
                const vouchesResult = await db.prepare(
                    "SELECT COUNT(*) as count FROM sales WHERE sellerId = ? AND is_vouched = 1"
                )
                    .bind(userId)
                    .first();
                totalVouches = vouchesResult?.count || 0;
            } catch (e) {
                console.error('Error fetching total vouches:', e);
                totalVouches = 0;
            }

            // Recalculate reputation to ensure it's up-to-date
            // Formula: (Sales * 2) + (Vouches * 10)
            let reputationPoints = 0;
            let tier = 'Candidate';
            try {
                const { calculateUserReputation } = await import('../../utils/reputation.js');
                const reputationData = await calculateUserReputation(db, userId);
                reputationPoints = reputationData.reputationPoints || 0;
                tier = reputationData.tier || 'Candidate';
            } catch (e) {
                console.error('Error recalculating reputation:', e);
                // Fallback: try to get from database
                try {
                    reputationPoints = userResult?.reputation_points || 0;
                    tier = userResult?.tier || 'Candidate';
                } catch (dbError) {
                    console.error('Error fetching reputation from database:', dbError);
                    reputationPoints = 0;
                    tier = 'Candidate';
                }
            }

            // Return user profile data
            return new Response(
                JSON.stringify({
                    success: true,
                    user: {
                        id: userResult.id,
                        name: userResult.name,
                        email: userResult.email,
                        created_at: userResult.created_at,
                        reputation_points: reputationPoints,
                        tier: tier,
                        verified: false // Placeholder - can be updated when verification system is implemented
                    },
                    stats: {
                        totalNotes: totalNotes,
                        totalVouches: totalVouches
                    }
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

