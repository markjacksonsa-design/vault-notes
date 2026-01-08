export async function onRequest(context) {
    try {
        const { request } = context;
        const db = context.env.DB;

        if (!db) {
            return new Response('Database not available', { status: 500 });
        }

        // Only allow GET requests
        if (request.method !== 'GET') {
            return new Response('Method not allowed', { status: 405 });
        }

        const url = new URL(request.url);
        const curriculum = url.searchParams.get('curriculum'); // Optional filter by curriculum

        let query = "SELECT code, name FROM subjects";
        const bindings = [];

        if (curriculum) {
            query += " WHERE curriculum = ?";
            bindings.push(curriculum);
        }

        query += " ORDER BY name ASC";

        const result = await db.prepare(query).bind(...bindings).all();

        return new Response(
            JSON.stringify({
                success: true,
                subjects: result.results || []
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Subjects API error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', message: error.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

