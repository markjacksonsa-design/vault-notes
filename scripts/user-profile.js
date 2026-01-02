// Unified User Profile Management
// Essential logic: Login status, User Name, and User ID

/**
 * Check if user is authenticated
 * @returns {Promise<Object|null>} User object if authenticated, null otherwise
 */
async function checkAuth() {
    try {
        const res = await fetch('/api/auth/check');
        const data = await res.json();
        
        if (data.authenticated && data.user) {
            return data.user;
        }
        return null;
    } catch (error) {
        console.error('Auth check error:', error);
        return null;
    }
}

/**
 * Get current user (synchronous check from cookie)
 * @returns {Object|null} User object if authenticated, null otherwise
 */
function getCurrentUser() {
    try {
        const cookies = document.cookie.split(';');
        const sessionCookie = cookies.find(c => c.trim().startsWith('session='));
        
        if (!sessionCookie) return null;
        
        const sessionValue = sessionCookie.split('=')[1];
        const sessionData = JSON.parse(atob(sessionValue));
        
        return {
            id: sessionData.userId,
            name: sessionData.name,
            email: sessionData.email
        };
    } catch (error) {
        return null;
    }
}

/**
 * Get user profile data from API
 * @returns {Promise<Object|null>} User profile object or null
 */
async function getUserProfile() {
    try {
        const user = await checkAuth();
        if (!user) return null;
        
        const res = await fetch('/api/user/profile');
        if (!res.ok) return null;
        
        const data = await res.json();
        if (data.success && data.user) {
            return data.user;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

/**
 * Logout user by clearing session cookie
 */
function logout() {
    document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/';
}

// Sidebar is handled by global-layout.js - no need to duplicate here

