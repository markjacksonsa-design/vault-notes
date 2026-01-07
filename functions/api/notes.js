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
                // Fetch a single note by ID with seller subaccount_code
                const note = await db.prepare(`
                    SELECT n.*, 
                           u.name as seller_name, 
                           u.subaccount_code as seller_subaccount_code
                    FROM notes n
                    LEFT JOIN users u ON n.seller_id = u.id
                    WHERE n.id = ?
                `).bind(noteId).first();
                
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
                
                // Filter by seller_id if my=true
                if (myNotes === 'true') {
                    // Get user_id from session cookie
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
                                try {
                                    const decoded = atob(sessionCookie);
                                    const sessionData = JSON.parse(decoded);
                                    userId = sessionData.userId || null;
                                } catch (e) {
                                    console.log('Error parsing session cookie:', e);
                                }
                            }
                        }
                    } catch (e) {
                        console.log('Could not extract user_id from session:', e);
                    }

                    if (userId) {
                        conditions.push("seller_id = ?");
                        bindings.push(userId);
                    } else {
                        // If not authenticated, return empty array
                        return new Response(
                            JSON.stringify([]),
                            {
                                status: 200,
                                headers: { 'Content-Type': 'application/json' }
                            }
                        );
                    }
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
            // Get user_id from session cookie
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
                        try {
                            const decoded = atob(sessionCookie);
                            const sessionData = JSON.parse(decoded);
                            userId = sessionData.userId || null;
                        } catch (e) {
                            console.log('Error parsing session cookie:', e);
                        }
                    }
                }
            } catch (e) {
                console.log('Could not extract user_id from session:', e);
            }

            // Require authentication for creating notes
            if (!userId) {
                return new Response(
                    JSON.stringify({ error: 'Authentication required to create notes' }),
                    {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }

            const body = await request.json();
            const { title, content, curriculum, level, subject, price, pdf_key, thumbnail_url } = body;
            
            // Ensure thumbnail_url is only a filename, not a full URL
            // Extract filename if a full URL is provided
            let thumbnailFilename = thumbnail_url || null;
            if (thumbnailFilename) {
                // If it's a full URL, extract just the filename
                try {
                    const urlObj = new URL(thumbnailFilename);
                    thumbnailFilename = urlObj.pathname.split('/').pop();
                } catch (e) {
                    // Not a valid URL, assume it's already a filename
                    // Remove any leading slashes
                    thumbnailFilename = thumbnailFilename.replace(/^\/+/, '');
                }
            }

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

            // Insert the note into the database with seller_id
            // Only store filename in thumbnail_url, not full URL
            const result = await db.prepare(
                "INSERT INTO notes (title, content, curriculum, level, subject, price, pdf_key, thumbnail_url, seller_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            ).bind(title, content, curriculum || null, level || null, subject || null, price || null, pdf_key || null, thumbnailFilename, userId).run();

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
            const { title, content, curriculum, level, subject, price, pdf_key, thumbnail_url } = body;
            
            // Ensure thumbnail_url is only a filename, not a full URL
            // Extract filename if a full URL is provided
            let thumbnailFilename = thumbnail_url || null;
            if (thumbnailFilename) {
                // If it's a full URL, extract just the filename
                try {
                    const urlObj = new URL(thumbnailFilename);
                    thumbnailFilename = urlObj.pathname.split('/').pop();
                } catch (e) {
                    // Not a valid URL, assume it's already a filename
                    // Remove any leading slashes
                    thumbnailFilename = thumbnailFilename.replace(/^\/+/, '');
                }
            }

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
            // Only store filename in thumbnail_url, not full URL
            const result = await db.prepare(
                "UPDATE notes SET title = ?, content = ?, curriculum = ?, level = ?, subject = ?, price = ?, pdf_key = ?, thumbnail_url = ? WHERE id = ?"
            ).bind(title, content, curriculum || null, level || null, subject || null, price || null, pdf_key || null, thumbnailFilename, noteId).run();

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

