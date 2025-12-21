export async function onRequest(context) {
    const db = context.env.DB; // This grabs your "DB" binding
    
    // This part sends a real SQL command to the database
    const { results } = await db.prepare("SELECT * FROM users").all();

    // This sends the data back to your website
    return Response.json(results);
}