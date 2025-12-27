/**
 * Route handler for /user/:id
 * Public route for viewing other users' profiles
 * Alternative to /profile/:userId for better semantic URLs
 */
export async function onRequest(context) {
    const { request, params } = context;
    
    // Only handle GET requests
    if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    // Get userId from params
    const userId = params.id;
    if (!userId) {
        return new Response('User ID is required', { status: 400 });
    }
    
    // Redirect to public-profile.html with userId in query parameter
    try {
        const url = new URL(request.url);
        url.pathname = '/public-profile.html';
        url.searchParams.set('userId', userId);
        return Response.redirect(url.toString(), 302);
    } catch (error) {
        console.error('Error serving user profile page:', error);
        return new Response('Internal server error', { status: 500 });
    }
}

