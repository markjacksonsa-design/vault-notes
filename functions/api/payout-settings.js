export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB;
        const paystackSecret = context.env.PAYSTACK_SECRET;

        // Handle CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                },
            });
        }

        const origin = request.headers.get('Origin') || '';
        const allowedOrigins = [
            'https://notevault.co.za',
            'https://www.notevault.co.za',
        ];
        const isAllowedOrigin = allowedOrigins.some(allowed => origin.includes(allowed)) || !origin;
        const corsHeaders = {
            'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (!db) {
            return new Response(JSON.stringify({ error: 'Database not available' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        if (!paystackSecret) {
            return new Response(JSON.stringify({ error: 'Paystack secret key not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Handle POST request
        if (request.method === 'POST') {
            // Get user from session
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
                console.log('Error parsing session:', e);
            }

            if (!userId) {
                return new Response(
                    JSON.stringify({ error: 'Unauthorized' }),
                    { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
                );
            }

            const { bankName, accountNumber } = await request.json();

            if (!bankName || !accountNumber) {
                return new Response(
                    JSON.stringify({ error: 'Bank name and account number are required' }),
                    { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
                );
            }

            // Get user email and name for Paystack subaccount
            let user;
            try {
                user = await db.prepare("SELECT email, name FROM users WHERE id = ?")
                    .bind(userId)
                    .first();
            } catch (e) {
                console.error('Error fetching user:', e);
                return new Response(
                    JSON.stringify({ error: 'Database error' }),
                    { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
                );
            }

            if (!user) {
                return new Response(
                    JSON.stringify({ error: 'User not found' }),
                    { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
                );
            }

            // Check if user already has a subaccount_code
            let existingUser;
            try {
                existingUser = await db.prepare("SELECT subaccount_code FROM users WHERE id = ?")
                    .bind(userId)
                    .first();
            } catch (e) {
                console.error('Error checking existing subaccount:', e);
            }

            let subaccountCode = existingUser?.subaccount_code || null;

            // If no subaccount exists, create one with Paystack
            if (!subaccountCode) {
                try {
                    // Create Paystack subaccount
                    const paystackResponse = await fetch('https://api.paystack.co/subaccount', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${paystackSecret}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            business_name: user.name || 'NoteVault Seller',
                            settlement_bank: bankName,
                            account_number: accountNumber,
                            percentage_charge: 20, // 20% commission for platform
                            description: `NoteVault seller account for ${user.email}`
                        })
                    });

                    if (!paystackResponse.ok) {
                        const errorData = await paystackResponse.json();
                        console.error('Paystack subaccount creation error:', errorData);
                        return new Response(
                            JSON.stringify({ 
                                error: 'Failed to create payout account',
                                details: errorData.message || 'Paystack API error'
                            }),
                            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
                        );
                    }

                    const paystackData = await paystackResponse.json();
                    
                    if (paystackData.status && paystackData.data) {
                        subaccountCode = paystackData.data.subaccount_code;
                    } else {
                        return new Response(
                            JSON.stringify({ error: 'Failed to create payout account' }),
                            { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
                        );
                    }
                } catch (e) {
                    console.error('Error creating Paystack subaccount:', e);
                    return new Response(
                        JSON.stringify({ error: 'Failed to create payout account' }),
                        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
                    );
                }
            }

            // Update user record with bank details and subaccount_code
            try {
                await db.prepare(
                    "UPDATE users SET bank_name = ?, account_number = ?, subaccount_code = ? WHERE id = ?"
                )
                    .bind(bankName, accountNumber, subaccountCode, userId)
                    .run();

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'Payout settings saved successfully',
                        subaccount_code: subaccountCode
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
                );
            } catch (e) {
                console.error('Error updating user payout settings:', e);
                return new Response(
                    JSON.stringify({ error: 'Failed to save payout settings' }),
                    { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
                );
            }
        }

        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
    } catch (error) {
        console.error('Payout settings error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', message: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

