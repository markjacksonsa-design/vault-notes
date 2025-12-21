export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB; // D1 database binding

        // Basic error handling - check if database is available
        if (!db) {
            return new Response('Database not available', { status: 500 });
        }
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
                // Fetch all notes with optional filtering and sorting
                const curriculum = url.searchParams.get('curriculum');
                const sort = url.searchParams.get('sort'); // 'price-asc' or 'price-desc'
                const myNotes = url.searchParams.get('my'); // 'true' to get user's notes
                
                let query = "SELECT * FROM notes";
                const bindings = [];
                const conditions = [];
                
                // For now, if my=true, return all notes (assuming single user)
                // Later this can be filtered by user_id when authentication is added
                if (myNotes === 'true') {
                    // Currently returns all notes - can be filtered by user_id later
                    // conditions.push("user_id = ?");
                    // bindings.push(userId);
                }
                
                // Add curriculum filter if provided
                if (curriculum && curriculum !== 'all') {
                    conditions.push("curriculum = ?");
                    bindings.push(curriculum);
                }
                
                // Combine conditions
                if (conditions.length > 0) {
                    query += " WHERE " + conditions.join(" AND ");
                }
                
                // Add sorting
                if (sort === 'price-asc') {
                    // Sort by price ascending, null prices at the end
                    query += " ORDER BY CASE WHEN price IS NULL THEN 1 ELSE 0 END, price ASC, id DESC";
                } else if (sort === 'price-desc') {
                    // Sort by price descending, null prices at the end
                    query += " ORDER BY CASE WHEN price IS NULL THEN 1 ELSE 0 END, price DESC, id DESC";
                } else {
                    // Default: order by id DESC
                    query += " ORDER BY id DESC";
                }
                
                // Execute query with bindings
                let stmt = db.prepare(query);
                if (bindings.length > 0) {
                    stmt = stmt.bind(...bindings);
                }
                const { results } = await stmt.all();
                
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
            const { title, content, curriculum, level, subject, price, pdf_key } = body;

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
                "INSERT INTO notes (title, content, curriculum, level, subject, price, pdf_key) VALUES (?, ?, ?, ?, ?, ?, ?)"
            ).bind(title, content, curriculum || null, level || null, subject || null, price || null, pdf_key || null).run();

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
            const { title, content, curriculum, level, subject, price, pdf_key } = body;

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
                "UPDATE notes SET title = ?, content = ?, curriculum = ?, level = ?, subject = ?, price = ?, pdf_key = ? WHERE id = ?"
            ).bind(title, content, curriculum || null, level || null, subject || null, price || null, pdf_key || null, noteId).run();

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

        // Handle DELETE request - delete a note
        if (request.method === 'DELETE') {
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

            // Delete the note from the database
            const result = await db.prepare("DELETE FROM notes WHERE id = ?").bind(noteId).run();

            if (result.success) {
                return new Response(
                    JSON.stringify({ 
                        success: true,
                        id: noteId,
                        message: 'Note deleted successfully' 
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            } else {
                throw new Error('Failed to delete note');
            }
        }

        // Handle unsupported methods
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            {
                status: 405,
                headers: { 
                    'Content-Type': 'application/json',
                    'Allow': 'GET, POST, PUT, DELETE'
                }
            }
        );

    } catch (error) {
        // Error handling - return actual error message
        console.error('Database error:', error);
        return new Response(error.message || 'Internal server error', { status: 500 });
    }
}

