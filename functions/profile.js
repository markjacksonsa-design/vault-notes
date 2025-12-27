/**
 * Route handler for /profile and /profile/:userId
 * - /profile: Private route for logged-in user (redirects to profile.html)
 * - /profile/:userId: Public route for viewing other users (redirects to public-profile.html)
 */
export async function onRequest(context) {
    const { request, params } = context;
    
    // Only handle GET requests
    if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
    }
    
    // Get userId from params (may be undefined for /profile route)
    const userId = params?.userId;
    
    // If no userId provided, this is the private /profile route
    if (!userId) {
        // Check if user is authenticated
        let isAuthenticated = false;
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
                    const decoded = atob(sessionCookie);
                    const sessionData = JSON.parse(decoded);
                    isAuthenticated = !!sessionData.userId;
                }
            }
        } catch (e) {
            // Not authenticated
            isAuthenticated = false;
        }
        
        // If not authenticated, redirect to login
        if (!isAuthenticated) {
            const url = new URL(request.url);
            url.pathname = '/login.html';
            url.searchParams.set('redirect', '/profile');
            return Response.redirect(url.toString(), 302);
        }
        
        // Authenticated user - serve private profile page
        try {
            const url = new URL(request.url);
            url.pathname = '/profile.html';
            return Response.redirect(url.toString(), 302);
        } catch (error) {
            console.error('Error serving private profile page:', error);
            return new Response('Internal server error', { status: 500 });
        }
    }
    
    // userId provided - this is a public profile route
    // Redirect to public-profile.html with userId in query parameter
    try {
        const url = new URL(request.url);
        url.pathname = '/public-profile.html';
        url.searchParams.set('userId', userId);
        return Response.redirect(url.toString(), 302);
    } catch (error) {
        console.error('Error serving public profile page:', error);
        return new Response('Internal server error', { status: 500 });
    }
}

