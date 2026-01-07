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
 * Logout user by clearing session cookie and localStorage
 * Redirects to index.html (landing page) after logout
 */
function logout() {
    // Clear session cookie
    document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    // Clear user from localStorage
    try {
        localStorage.removeItem('user');
    } catch (e) {
        // localStorage might be disabled, that's okay
    }
    // Redirect to landing page
    window.location.href = '/index.html';
}

/**
 * Calculate user's reputation based on sales and vouches
 * Fetches reputation data from the API
 * @returns {Promise<Object|null>} Reputation data with points and tier, or null on error
 */
async function calculateUserReputation() {
    try {
        const user = await checkAuth();
        if (!user) return null;
        
        // Fetch reputation from seller stats API
        const res = await fetch('/api/seller/stats');
        if (!res.ok) return null;
        
        const data = await res.json();
        if (data.success) {
            return {
                reputationPoints: data.reputationPoints || 0,
                tier: data.tier || 'Candidate',
                salesCount: data.totalDownloads || 0
            };
        }
        return null;
    } catch (error) {
        console.error('Error calculating reputation:', error);
        return null;
    }
}

/**
 * Update reputation bar UI with reputation data
 * @param {Object} reputationData - Reputation data object
 */
function updateReputationBar(reputationData) {
    const reputationBar = document.getElementById('reputation-bar');
    if (!reputationBar) return;
    
    const progressFill = reputationBar.querySelector('.reputation-bar-fill');
    if (!progressFill) return;
    
    if (!reputationData || reputationData.reputationPoints === undefined) {
        progressFill.style.width = '0%';
        return;
    }
    
    // Calculate progress percentage (0-100)
    // Based on tier thresholds: Candidate (0-20), Scholar (21-50), Elite (51-80), Distinction (81+)
    const points = reputationData.reputationPoints || 0;
    let progress = 0;
    
    if (points >= 81) {
        progress = 100; // Max tier
    } else if (points >= 51) {
        // Elite tier: 51-80 points
        progress = ((points - 51) / 30) * 100;
    } else if (points >= 21) {
        // Scholar tier: 21-50 points
        progress = ((points - 21) / 30) * 100;
    } else {
        // Candidate tier: 0-20 points
        progress = (points / 21) * 100;
    }
    
    // Ensure progress is between 0 and 100
    progress = Math.min(100, Math.max(0, progress));
    
    // Set the width of the progress fill
    progressFill.style.width = `${progress}%`;
}

// Sidebar is handled by global-layout.js - no need to duplicate here

/**
 * Global Access Control - Check if user is logged in before accessing protected pages
 * Redirects to index.html if user is not authenticated
 * Should be called at the very top of every HTML file's script section (except index.html)
 */
function checkAccess() {
    // Get current page path
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Allow access to index.html, login.html, and register.html without authentication
    const publicPages = ['index.html', 'login.html', 'register.html', ''];
    
    // If on a public page, allow access
    if (publicPages.includes(currentPage)) {
        return;
    }
    
    // Check for user in localStorage (primary check)
    let isLoggedIn = false;
    try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user && (user.id || user.userId)) {
                isLoggedIn = true;
            }
        }
    } catch (e) {
        // localStorage check failed, continue to cookie check
    }
    
    // Fallback: Check session cookie if localStorage doesn't have user
    if (!isLoggedIn) {
        const user = getCurrentUser();
        if (user && (user.id || user.userId)) {
            isLoggedIn = true;
            // Store in localStorage for future checks
            try {
                localStorage.setItem('user', JSON.stringify(user));
            } catch (e) {
                // localStorage might be disabled, that's okay
            }
        }
    }
    
    // If not logged in, redirect to index.html immediately
    if (!isLoggedIn) {
        window.location.replace('/index.html');
        return;
    }
}

