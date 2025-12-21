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
        // Handle GET request - fetch all notes or a specific note by ID
        if (request.method === 'GET') {
            const url = new URL(request.url);
            const noteId = url.searchParams.get('id');
            
            if (noteId) {
                // Fetch a single note by ID
                const note = await db.prepare("SELECT * FROM notes WHERE id = ?").bind(noteId).first();
                
                if (!note) {
                    return new Response(
                        JSON.stringify({ error: 'Note not found' }),
                        {
                            status: 404,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }
                
                return new Response(
                    JSON.stringify(note),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            } else {
                // Fetch all notes
                const { results } = await db.prepare("SELECT * FROM notes ORDER BY id DESC").all();
                
                return new Response(
                    JSON.stringify(results || []),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }
        }

        // Handle POST request - create a new note
        if (request.method === 'POST') {
            const body = await request.json();
            const { title, content, curriculum, level, subject } = body;

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
                "INSERT INTO notes (title, content, curriculum, level, subject) VALUES (?, ?, ?, ?, ?)"
            ).bind(title, content, curriculum || null, level || null, subject || null).run();

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

        // Handle PUT request - update an existing note
        if (request.method === 'PUT') {
            const url = new URL(request.url);
            const noteId = url.searchParams.get('id');
            
            if (!noteId) {
                return new Response(
                    JSON.stringify({ error: 'Note ID is required' }),
                    {
                        status: 400,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            const body = await request.json();
            const { title, content, curriculum, level, subject } = body;

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

            // Check if note exists
            const existingNote = await db.prepare("SELECT id FROM notes WHERE id = ?").bind(noteId).first();
            if (!existingNote) {
                return new Response(
                    JSON.stringify({ error: 'Note not found' }),
                    {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            // Update the note in the database
            const result = await db.prepare(
                "UPDATE notes SET title = ?, content = ?, curriculum = ?, level = ?, subject = ? WHERE id = ?"
            ).bind(title, content, curriculum || null, level || null, subject || null, noteId).run();

            if (result.success) {
                return new Response(
                    JSON.stringify({ 
                        success: true,
                        id: noteId,
                        message: 'Note updated successfully' 
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            } else {
                throw new Error('Failed to update note');
            }
        }

        // Handle unsupported methods
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { 
                    'Content-Type': 'application/json',
                    'Allow': 'GET, POST, PUT'
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

