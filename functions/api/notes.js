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
        // Handle GET request - fetch all notes
        if (request.method === 'GET') {
            const { results } = await db.prepare("SELECT * FROM notes ORDER BY id DESC").all();
            
            return new Response(
                JSON.stringify(results || []),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Handle POST request - create a new note
        if (request.method === 'POST') {
            const body = await request.json();
            const { title, content } = body;

            // Validate required fields
            if (!title || !content) {
                return new Response(
                    JSON.stringify({ error: 'Title and content are required' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Insert the note into the database
            const result = await db.prepare(
                "INSERT INTO notes (title, content) VALUES (?, ?)"
            ).bind(title, content).run();

            if (result.success) {
                return new Response(
                    JSON.stringify({ 
                        success: true, 
                        id: result.meta.last_row_id,
                        message: 'Note created successfully' 
                    }),
                    {
                        status: 201,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            } else {
                throw new Error('Failed to insert note');
            }
        }

        // Handle unsupported methods
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { 
                    'Content-Type': 'application/json',
                    'Allow': 'GET, POST'
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

