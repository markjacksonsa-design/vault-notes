// Auth helper functions for client-side session management

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
 * Update navigation links based on auth status
 */
async function updateNavAuth() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    const user = await checkAuth();
    
    // Find or create auth link container
    let authLink = navLinks.querySelector('.auth-link');
    if (!authLink) {
        authLink = document.createElement('div');
        authLink.className = 'auth-link';
        navLinks.appendChild(authLink);
    }
    
    // Clear existing content
    authLink.innerHTML = '';
    
    if (user) {
        // User is logged in - show name and logout
        const userSpan = document.createElement('span');
        userSpan.style.cssText = 'color: var(--accent); font-weight: 600; margin-right: 16px;';
        userSpan.textContent = user.name || user.email;
        authLink.appendChild(userSpan);
        
        // Show "My Vault" link if it exists, or create it
        const myVaultLink = document.getElementById('my-vault-link');
        if (myVaultLink) {
            myVaultLink.style.display = 'block';
        } else {
            // Create My Vault link if it doesn't exist
            const vaultLink = document.createElement('a');
            vaultLink.href = '/my-vault.html';
            vaultLink.textContent = 'My Vault';
            vaultLink.style.marginRight = '16px';
            authLink.appendChild(vaultLink);
        }
        
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Logout';
        logoutLink.onclick = async (e) => {
            e.preventDefault();
            // Clear session cookie
            document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            window.location.reload();
        };
        authLink.appendChild(logoutLink);
    } else {
        // Hide "My Vault" link if user is not logged in
        const myVaultLink = document.getElementById('my-vault-link');
        if (myVaultLink) {
            myVaultLink.style.display = 'none';
        }
        // User not logged in - show Login and Register buttons
        const loginBtn = document.createElement('a');
        loginBtn.href = '/login.html';
        loginBtn.textContent = 'Login';
        loginBtn.className = 'nav-btn';
        authLink.appendChild(loginBtn);
        
        const registerBtn = document.createElement('a');
        registerBtn.href = '/register.html';
        registerBtn.textContent = 'Register';
        registerBtn.className = 'nav-btn';
        registerBtn.style.cssText = 'background: var(--accent); color: #000; padding: 8px 16px; border-radius: 6px; font-weight: 600; margin-left: 8px;';
        authLink.appendChild(registerBtn);
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

// Auto-update nav on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavAuth);
} else {
    updateNavAuth();
}

