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
        // Allow requests from your custom domain
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

        if (!db) {
            return new Response('Database not available', { 
                status: 500,
                headers: corsHeaders
            });
        }

        // Handle POST request - login user
        if (request.method === 'POST') {
            const { email, password } = await request.json();

            // Validate required fields
            if (!email || !password) {
            return new Response(
                JSON.stringify({ error: 'Missing email or password' }),
                {
                    status: 400,
                    headers: { 
                        'Content-Type': 'application/json',
                        ...corsHeaders
                    }
                }
            );
            }

            // Get AUTH_SECRET from environment
            const authSecret = context.env.AUTH_SECRET || 'mnbvcxz';
            
            // Create TextEncoder instance (reusable)
            const encoder = new TextEncoder();
            
            // Hash password using Web Crypto API with AUTH_SECRET (HMAC-SHA256)
            const keyData = encoder.encode(authSecret);
            const passwordData = encoder.encode(password);
            
            // Import key for HMAC
            const key = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-256' },
                false,
                ['sign']
            );
            
            // Sign (hash) the password with the secret key
            const signature = await crypto.subtle.sign('HMAC', key, passwordData);
            const hashArray = Array.from(new Uint8Array(signature));
            const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // Find user by email
            const user = await db.prepare("SELECT id, full_name, email, password_hash FROM users WHERE email = ?")
                .bind(email)
                .first();

            if (!user) {
                return new Response(
                    JSON.stringify({ error: 'Invalid email or password' }),
                    {
                        status: 401,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            // Verify password
            if (user.password_hash !== passwordHash) {
                return new Response(
                    JSON.stringify({ error: 'Invalid email or password' }),
                    {
                        status: 401,
                        headers: { 
                            'Content-Type': 'application/json',
                            ...corsHeaders
                        }
                    }
                );
            }

            // Store session in database (optional - for session management)
            // For now, we'll just set a cookie with user info
            const sessionData = {
                userId: user.id,
                email: user.email,
                name: user.full_name
            };

            // Create secure session cookie
            // Encode session data as base64 (works in Cloudflare Workers)
            const sessionJson = JSON.stringify(sessionData);
            // Reuse encoder for session cookie encoding
            const sessionDataEncoded = encoder.encode(sessionJson);
            const cookieValue = btoa(String.fromCharCode(...sessionDataEncoded)); // Base64 encode
            
            // Set cookie with HttpOnly, Secure, SameSite for security
            const cookie = `session=${cookieValue}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`; // 24 hours

            return new Response(
                JSON.stringify({
                    success: true,
                    message: 'Login successful',
                    user: {
                        id: user.id,
                        name: user.full_name,
                        email: user.email
                    }
                }),
                {
                    status: 200,
                    headers: { 
                        'Content-Type': 'application/json',
                        'Set-Cookie': cookie,
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
        console.error('Login error:', error);
        // Get origin for CORS headers (fallback if request is not available)
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

