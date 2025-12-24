export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB; // D1 database binding

        // Basic error handling - check if database is available
        if (!db) {
            return new Response('Database not available', { status: 500 });
        }

        // Handle GET request - search notes with filters
        if (request.method === 'GET') {
            const url = new URL(request.url);
            const curriculum = url.searchParams.get('curriculum');
            const grade = url.searchParams.get('grade'); // This maps to 'level' in the database
            const subject = url.searchParams.get('subject');
            
            let query = "SELECT * FROM notes";
            const bindings = [];
            const conditions = [];
            
            // Add curriculum filter if provided
            if (curriculum && curriculum !== 'all' && curriculum !== 'null') {
                conditions.push("curriculum = ?");
                bindings.push(curriculum);
            }
            
            // Add grade (level) filter if provided
            if (grade && grade !== 'null') {
                conditions.push("level = ?");
                bindings.push(grade);
            }
            
            // Add subject filter if provided
            if (subject && subject !== 'null') {
                conditions.push("subject = ?");
                bindings.push(subject);
            }
            
            // Combine conditions
            if (conditions.length > 0) {
                query += " WHERE " + conditions.join(" AND ");
            }
            
            // Default: order by id DESC
            query += " ORDER BY id DESC";
            
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
        // Error handling - return actual error message
        console.error('Database error:', error);
        return new Response(error.message || 'Internal server error', { status: 500 });
    }
}

