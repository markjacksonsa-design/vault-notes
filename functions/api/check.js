export async function onRequest(context) {
    // This looks for a database binding named "DB"
    const db = context.env.DB;
    
    if (!db) {
        return new Response("Database not linked yet!", { status: 200 });
    }

    return new Response("Database is Connected!");
}