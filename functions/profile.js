/**
 * Route handler for /profile/:userId
 * Serves the public-profile.html page with userId in query parameter
 * SEO-friendly profile URLs: /profile/[userId]
 */
export async function onRequest(context) {
    const { request, params } = context;
    
    // Only handle GET requests
    if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    // Get userId from params
    const userId = params.userId;
    if (!userId) {
        return new Response('User ID is required', { status: 400 });
    }
    
    // Redirect to public-profile.html with userId in query parameter
    // This maintains clean URLs while allowing the page to access the userId
    try {
        const url = new URL(request.url);
        url.pathname = '/public-profile.html';
        url.searchParams.set('userId', userId);
        // Use 302 redirect to allow URL to remain as /profile/:userId in browser
        return Response.redirect(url.toString(), 302);
    } catch (error) {
        console.error('Error serving profile page:', error);
        return new Response('Internal server error', { status: 500 });
    }
}

