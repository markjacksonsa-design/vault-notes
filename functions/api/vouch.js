export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB; // D1 database binding

        // Handle CORS preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        // Get origin from request
        const origin = request.headers.get('Origin') || '';
        const allowedOrigins = [
            'https://notevault.co.za',
            'https://www.notevault.co.za',
        ];
        const isAllowedOrigin = allowedOrigins.some(allowed => origin.includes(allowed)) || !origin;
        const corsHeaders = {
            'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Check if database is available
        if (!db) {
            return new Response(
                JSON.stringify({ error: 'Database not available' }),
                {
                    status: 500,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                }
            );
        }

        // Handle POST request - vouch for a seller
        if (request.method === 'POST') {
            // Get buyerId from session cookie
            let buyerId = null;
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
                        buyerId = sessionData.userId || null;
                    }
                }
            } catch (e) {
                console.log('Could not extract buyerId from session:', e);
            }

            if (!buyerId) {
                return new Response(
                    JSON.stringify({ error: 'Not authenticated' }),
                    {
                        status: 401,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            const { saleId } = await request.json();

            if (!saleId) {
                return new Response(
                    JSON.stringify({ error: 'Missing saleId' }),
                    {
                        status: 400,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            // Verify the sale exists and belongs to the buyer
            const sale = await db.prepare(
                "SELECT id, sellerId, buyerId, is_vouched FROM sales WHERE id = ? AND buyerId = ?"
            )
                .bind(saleId, buyerId)
                .first();

            if (!sale) {
                return new Response(
                    JSON.stringify({ error: 'Sale not found or access denied' }),
                    {
                        status: 404,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            // Check if already vouched
            if (sale.is_vouched) {
                return new Response(
                    JSON.stringify({ error: 'Already vouched for this sale' }),
                    {
                        status: 400,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            const sellerId = sale.sellerId;

            if (!sellerId) {
                return new Response(
                    JSON.stringify({ error: 'Seller not found for this sale' }),
                    {
                        status: 400,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            // Import reputation utilities
            const { calculateUserReputation } = await import('../utils/reputation.js');

            // Mark sale as vouched first
            await db.prepare(
                "UPDATE sales SET is_vouched = 1 WHERE id = ?"
            )
                .bind(saleId)
                .run();

            // Recalculate seller's reputation (includes the new vouch)
            const reputationData = await calculateUserReputation(db, sellerId);

            // Get updated seller info with tier
            const updatedSeller = await db.prepare("SELECT reputation_points, tier FROM users WHERE id = ?")
                .bind(sellerId)
                .first();

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Vouch recorded successfully',
                    sellerReputation: updatedSeller.reputation_points,
                    sellerTier: updatedSeller.tier
                }),
                {
                    status: 200,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
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
                    'Allow': 'POST',
                    ...corsHeaders
                }
            }
        );

    } catch (error) {
        console.error('Vouch API error:', error);
        const origin = context?.request?.headers?.get('Origin') || '';
        const allowedOrigins = [
            'https://notevault.co.za',
            'https://www.notevault.co.za',
        ];
        const isAllowedOrigin = allowedOrigins.some(allowed => origin.includes(allowed)) || !origin;
        const corsHeaders = {
            'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        return new Response(
            JSON.stringify({ 
                error: 'Internal server error', 
                message: error.message 
            }),
            { 
                status: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            }
        );
    }
}

