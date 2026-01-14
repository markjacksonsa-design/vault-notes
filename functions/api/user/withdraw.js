export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB;
        const paystackSecret = context.env.PAYSTACK_SECRET;

        if (!db) {
            return new Response(JSON.stringify({ error: 'Database not available' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!paystackSecret) {
            return new Response(JSON.stringify({ error: 'Paystack secret key not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Handle POST request - initiate withdrawal
        if (request.method === 'POST') {
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

            // Get withdrawal amount from request
            const { amount } = await request.json();

            if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                return new Response(
                    JSON.stringify({ error: 'Invalid withdrawal amount' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            const withdrawalAmount = parseFloat(amount);

            // Get user's payout settings (subaccount_code, bank details)
            let user;
            try {
                user = await db.prepare(
                    "SELECT subaccount_code, bank_name, account_number, email, name FROM users WHERE id = ?"
                )
                    .bind(userId)
                    .first();
            } catch (e) {
                console.error('Error fetching user:', e);
                return new Response(
                    JSON.stringify({ error: 'Database error' }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }

            if (!user) {
                return new Response(
                    JSON.stringify({ error: 'User not found' }),
                    { status: 404, headers: { 'Content-Type': 'application/json' } }
                );
            }

            if (!user.subaccount_code) {
                return new Response(
                    JSON.stringify({ error: 'Payout settings not configured. Please set up your bank details first.' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }

            if (!user.bank_name || !user.account_number) {
                return new Response(
                    JSON.stringify({ error: 'Bank details incomplete. Please update your payout settings.' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // Calculate available balance (total earnings minus previous withdrawals)
            let totalEarnings = 0;
            try {
                const earningsResult = await db.prepare(
                    "SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE sellerId = ? AND status = 'completed'"
                )
                    .bind(userId)
                    .first();
                totalEarnings = earningsResult?.total ?? 0;
            } catch (e) {
                console.error('Error fetching total earnings:', e);
                return new Response(
                    JSON.stringify({ error: 'Failed to calculate balance' }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // Get total withdrawals (if withdrawals table exists)
            let totalWithdrawals = 0;
            try {
                // Check if withdrawals table exists by trying to query it
                const withdrawalsResult = await db.prepare(
                    "SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_id = ? AND status = 'completed'"
                )
                    .bind(userId)
                    .first();
                totalWithdrawals = withdrawalsResult?.total ?? 0;
            } catch (e) {
                // Table might not exist yet, that's okay - no withdrawals yet
                console.log('Withdrawals table may not exist yet:', e);
                totalWithdrawals = 0;
            }

            const availableBalance = totalEarnings - totalWithdrawals;

            if (withdrawalAmount > availableBalance) {
                return new Response(
                    JSON.stringify({ 
                        error: 'Insufficient balance', 
                        availableBalance: availableBalance 
                    }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // Minimum withdrawal amount (e.g., R100)
            const minimumWithdrawal = 100;
            if (withdrawalAmount < minimumWithdrawal) {
                return new Response(
                    JSON.stringify({ 
                        error: `Minimum withdrawal amount is R${minimumWithdrawal.toFixed(2)}` 
                    }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // For Paystack transfers, we need to create a transfer recipient first
            // Note: bank_name should ideally be a bank code, but we'll handle both cases
            let recipientCode = null;
            let bankCode = user.bank_name;
            
            // If bank_name looks like a name (contains letters), we need to resolve it to a code
            // For now, we'll assume bank_name is stored as a code (numeric string)
            // If it's not, the API will return an error and we can handle it
            
            try {
                // Create transfer recipient
                const recipientResponse = await fetch('https://api.paystack.co/transferrecipient', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${paystackSecret}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'nuban',
                        name: user.name || 'NoteVault Seller',
                        account_number: user.account_number,
                        bank_code: bankCode, // Should be numeric bank code
                        currency: 'ZAR',
                        description: `Withdrawal for ${user.email}`
                    })
                });

                const recipientData = await recipientResponse.json();

                if (!recipientResponse.ok) {
                    // Check if recipient already exists (duplicate error)
                    if (recipientData.message && recipientData.message.includes('already exists')) {
                        // Try to find existing recipient by listing them
                        const listResponse = await fetch('https://api.paystack.co/transferrecipient', {
                            headers: {
                                'Authorization': `Bearer ${paystackSecret}`
                            }
                        });
                        
                        if (listResponse.ok) {
                            const listData = await listResponse.json();
                            if (listData.status && listData.data) {
                                // Find recipient with matching account number
                                const existingRecipient = listData.data.find(r => 
                                    r.details && r.details.account_number === user.account_number
                                );
                                if (existingRecipient) {
                                    recipientCode = existingRecipient.recipient_code;
                                }
                            }
                        }
                    } else {
                        // Other error - return it
                        return new Response(
                            JSON.stringify({ 
                                error: 'Failed to create transfer recipient',
                                details: recipientData.message || 'Invalid bank details. Please ensure your bank code is correct.'
                            }),
                            { status: 400, headers: { 'Content-Type': 'application/json' } }
                        );
                    }
                } else if (recipientData.status && recipientData.data) {
                    recipientCode = recipientData.data.recipient_code;
                }
            } catch (e) {
                console.error('Error creating transfer recipient:', e);
                return new Response(
                    JSON.stringify({ error: 'Failed to create transfer recipient', details: e.message }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }

            if (!recipientCode) {
                return new Response(
                    JSON.stringify({ error: 'Failed to create or find transfer recipient' }),
                    { status: 400, headers: { 'Content-Type': 'application/json' } }
                );
            }

            // Initiate transfer
            try {
                const transferPayload = {
                    source: 'balance', // Transfer from main balance
                    amount: Math.round(withdrawalAmount * 100), // Convert to cents (ZAR uses cents)
                    recipient: recipientCode,
                    reason: `Withdrawal for ${user.email}`,
                    currency: 'ZAR'
                };

                // Note: For subaccount transfers, Paystack handles settlement automatically
                // If you want to transfer from subaccount balance specifically, you'd use:
                // source: 'subaccount', subaccount: user.subaccount_code
                // But typically, subaccounts auto-settle, so we transfer from main balance

                const transferResponse = await fetch('https://api.paystack.co/transfer', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${paystackSecret}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(transferPayload)
                });

                if (!transferResponse.ok) {
                    const errorData = await transferResponse.json();
                    console.error('Paystack transfer error:', errorData);
                    return new Response(
                        JSON.stringify({ 
                            error: 'Failed to process withdrawal',
                            details: errorData.message || 'Paystack API error'
                        }),
                        { status: 400, headers: { 'Content-Type': 'application/json' } }
                    );
                }

                const transferData = await transferResponse.json();
                
                if (!transferData.status || !transferData.data) {
                    return new Response(
                        JSON.stringify({ error: 'Failed to process withdrawal' }),
                        { status: 400, headers: { 'Content-Type': 'application/json' } }
                    );
                }

                const transferReference = transferData.data.reference || transferData.data.transfer_code;
                const transferStatus = transferData.data.status || 'pending';

                // Record withdrawal in database
                try {
                    // Create withdrawals table if it doesn't exist (this will fail silently if table exists)
                    await db.prepare(`
                        CREATE TABLE IF NOT EXISTS withdrawals (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            user_id INTEGER NOT NULL,
                            amount REAL NOT NULL,
                            reference TEXT UNIQUE NOT NULL,
                            status TEXT NOT NULL,
                            created_at TEXT NOT NULL,
                            FOREIGN KEY (user_id) REFERENCES users(id)
                        )
                    `).run();

                    // Insert withdrawal record
                    await db.prepare(
                        "INSERT INTO withdrawals (user_id, amount, reference, status, created_at) VALUES (?, ?, ?, ?, ?)"
                    )
                        .bind(
                            userId,
                            withdrawalAmount,
                            transferReference,
                            transferStatus,
                            new Date().toISOString()
                        )
                        .run();
                } catch (dbError) {
                    console.error('Error recording withdrawal:', dbError);
                    // Don't fail the request if we can't record it - the transfer already happened
                }

                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'Withdrawal initiated successfully',
                        reference: transferReference,
                        status: transferStatus,
                        amount: withdrawalAmount
                    }),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            } catch (e) {
                console.error('Error processing withdrawal:', e);
                return new Response(
                    JSON.stringify({ error: 'Failed to process withdrawal', details: e.message }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }

        // Handle GET request - get withdrawal history and available balance
        if (request.method === 'GET') {
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

            // Calculate available balance
            let totalEarnings = 0;
            try {
                const earningsResult = await db.prepare(
                    "SELECT COALESCE(SUM(amount), 0) as total FROM sales WHERE sellerId = ? AND status = 'completed'"
                )
                    .bind(userId)
                    .first();
                totalEarnings = earningsResult?.total ?? 0;
            } catch (e) {
                console.error('Error fetching total earnings:', e);
            }

            let totalWithdrawals = 0;
            let withdrawals = [];
            try {
                const withdrawalsResult = await db.prepare(
                    "SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_id = ? AND status = 'completed'"
                )
                    .bind(userId)
                    .first();
                totalWithdrawals = withdrawalsResult?.total ?? 0;

                // Get withdrawal history
                const withdrawalsList = await db.prepare(
                    "SELECT * FROM withdrawals WHERE user_id = ? ORDER BY created_at DESC LIMIT 10"
                )
                    .bind(userId)
                    .all();
                withdrawals = withdrawalsList.results || [];
            } catch (e) {
                // Table might not exist yet
                console.log('Withdrawals table may not exist:', e);
            }

            const availableBalance = totalEarnings - totalWithdrawals;

            return new Response(
                JSON.stringify({
                    success: true,
                    availableBalance: availableBalance,
                    totalEarnings: totalEarnings,
                    totalWithdrawals: totalWithdrawals,
                    withdrawals: withdrawals
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { 
                    'Content-Type': 'application/json',
                    'Allow': 'POST, GET'
                }
            }
        );
    } catch (error) {
        console.error('Withdrawal API error:', error);
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

