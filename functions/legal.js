/**
 * Route handler for /legal
 * Redirects to /legal.html (Cloudflare Pages serves static HTML files directly)
 * This function ensures /legal works as an alias
 */
export async function onRequest(context) {
    const { request } = context;
    
    // Only handle GET requests
    if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    // Redirect to legal.html
    const url = new URL(request.url);
    url.pathname = '/legal.html';
    return Response.redirect(url.toString(), 301);
}

