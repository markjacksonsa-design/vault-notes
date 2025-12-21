export async function onRequest(context) {
    try {
        const { request, env } = context;
        const db = env.DB; // D1 database binding

        if (!db) {
            return new Response('Database not available', { status: 500 });
        }

        // Handle POST request - register new user
        if (request.method === 'POST') {
            const { name, email, password } = await request.json();

            // Validate required fields
            if (!name || !email || !password) {
                return new Response(
                    JSON.stringify({ error: 'Missing required fields' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return new Response(
                    JSON.stringify({ error: 'Invalid email format' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Validate password length
            if (password.length < 8) {
                return new Response(
                    JSON.stringify({ error: 'Password must be at least 8 characters' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Check if user already exists
            const existingUser = await db.prepare("SELECT id FROM users WHERE email = ?")
                .bind(email)
                .first();

            if (existingUser) {
                return new Response(
                    JSON.stringify({ error: 'Email already registered' }),
                    {
                        status: 409,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Hash password using Web Crypto API
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // Insert new user into database
            const result = await db.prepare(
                "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)"
            )
                .bind(name, email, passwordHash, new Date().toISOString())
                .run();

            if (result.success) {
                return new Response(
                    JSON.stringify({
                        success: true,
                        message: 'User registered successfully',
                        userId: result.meta.last_row_id
                    }),
                    {
                        status: 201,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            } else {
                throw new Error('Failed to create user');
            }
        }

        // Handle unsupported methods
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { 
                    'Content-Type': 'application/json',
                    'Allow': 'POST'
                }
            }
        );

    } catch (error) {
        console.error('Registration error:', error);
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

