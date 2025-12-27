export async function onRequest(context) {
    try {
        const { request, params } = context;
        const db = context.env.DB;

        if (!db) {
            return new Response('Database not available', { status: 500 });
        }

        // Handle GET request - fetch public profile
        if (request.method === 'GET') {
            const userId = params.userId;

            if (!userId) {
                return new Response(
                    JSON.stringify({ error: 'User ID is required' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Get user profile data (public info only)
            const userResult = await db.prepare(
                "SELECT id, name, reputation_points, tier, bio FROM users WHERE id = ?"
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

            // Recalculate reputation to ensure it's up-to-date
            let reputationPoints = 0;
            let tier = 'Candidate';
            try {
                const { calculateUserReputation } = await import('../../../utils/reputation.js');
                const reputationData = await calculateUserReputation(db, userId);
                reputationPoints = reputationData.reputationPoints || 0;
                tier = reputationData.tier || 'Candidate';
            } catch (e) {
                console.error('Error recalculating reputation:', e);
                reputationPoints = userResult?.reputation_points || 0;
                tier = userResult?.tier || 'Candidate';
            }

            // Get user's notes for sale
            let notes = [];
            try {
                const notesResult = await db.prepare(
                    "SELECT id, title, price FROM notes WHERE seller_id = ? ORDER BY created_at DESC"
                )
                    .bind(userId)
                    .all();
                notes = notesResult.results || [];
            } catch (e) {
                console.error('Error fetching notes:', e);
                notes = [];
            }

            // Return public profile data
            return new Response(
                JSON.stringify({
                    success: true,
                    user: {
                        id: userResult.id,
                        name: userResult.name,
                        reputation_points: reputationPoints,
                        tier: tier,
                        bio: userResult.bio || ''
                    },
                    notes: notes
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
        console.error('Public profile API error:', error);
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

