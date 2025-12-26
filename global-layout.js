// Global Layout System - Injects sidebar and header into all pages

/**
 * Initialize global layout (sidebar and header)
 */
async function initGlobalLayout() {
    // Inject header if it doesn't exist
    if (!document.querySelector('.global-header')) {
        injectGlobalHeader();
    }
    
    // Inject sidebar if it doesn't exist
    if (!document.querySelector('.global-sidebar')) {
        injectGlobalSidebar();
    }
    
    // Update sidebar based on auth status
    await updateSidebarAuth();
    
    // Update header profile icon
    await updateHeaderProfile();
}

/**
 * Inject global header with search and profile
 */
function injectGlobalHeader() {
    const headerHTML = `
        <header class="global-header">
            <div class="header-search">
                <input type="text" placeholder="Search notes..." id="header-search-input" class="header-search-input">
            </div>
            <div class="profile-container">
                <div class="profile-icon" id="profile-icon">U</div>
                <div class="profile-dropdown" id="profile-dropdown">
                    <a href="#" id="settings-link">Settings</a>
                    <a href="#" id="logout-link">Logout</a>
                </div>
            </div>
        </header>
    `;
    
    // Insert header at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    
    // Add header styles if not already present
    if (!document.getElementById('global-header-styles')) {
        const style = document.createElement('style');
        style.id = 'global-header-styles';
        style.textContent = `
            .global-header {
                background: rgba(13, 13, 13, 0.85);
                backdrop-filter: blur(10px);
                padding: 16px 32px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                border-bottom: 2px solid var(--accent);
                position: sticky;
                top: 0;
                z-index: 1002;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 24px;
            }
            .header-search {
                flex: 1;
                max-width: 600px;
                margin: 0 auto;
            }
            .header-search-input {
                width: 100%;
                background: var(--input-bg);
                color: var(--text);
                border: 2px solid transparent;
                border-radius: 8px;
                padding: 10px 16px;
                font-size: 0.95em;
                outline: none;
                transition: all 0.2s;
            }
            .header-search-input:focus {
                border-color: var(--accent);
                box-shadow: 0 0 0 3px rgba(0, 255, 133, 0.1);
            }
            .header-search-input::placeholder {
                color: var(--subtitle);
                opacity: 0.6;
            }
            .profile-container {
                position: relative;
            }
            .profile-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: var(--accent);
                color: var(--bg);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-weight: 700;
                font-size: 1.1em;
                transition: all 0.2s;
                border: 2px solid transparent;
            }
            .profile-icon:hover {
                transform: scale(1.05);
                border-color: var(--accent);
                box-shadow: 0 0 0 3px rgba(0, 255, 133, 0.2);
            }
            .profile-dropdown {
                position: absolute;
                top: calc(100% + 8px);
                right: 0;
                background: var(--panel);
                border-radius: 8px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
                min-width: 180px;
                display: none;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.1);
                z-index: 1003;
            }
            .profile-dropdown.open {
                display: block;
            }
            .profile-dropdown a {
                display: block;
                padding: 12px 20px;
                color: var(--text);
                text-decoration: none;
                transition: background 0.2s;
                font-size: 0.95em;
            }
            .profile-dropdown a:hover {
                background: var(--input-bg);
                color: var(--accent);
            }
            .profile-dropdown a:first-child {
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .profile-icon.login-btn {
                background: var(--input-bg);
                color: var(--text);
                border: 2px solid var(--accent);
            }
            .profile-icon.login-btn:hover {
                background: var(--accent);
                color: var(--bg);
            }
            @media (max-width: 768px) {
                .global-header {
                    padding: 12px 20px;
                }
                .header-search {
                    max-width: none;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add event listeners
    setupHeaderListeners();
}

/**
 * Inject global sidebar
 */
function injectGlobalSidebar() {
    const sidebarHTML = `
        <aside class="global-sidebar">
            <nav class="sidebar-nav">
                <a href="/list.html" class="sidebar-link" data-page="browse">Browse</a>
                <a href="/my-vault.html" class="sidebar-link" data-page="vault">My Vault</a>
                <a href="/seller-dashboard.html" class="sidebar-link" data-page="earnings">Earnings</a>
            </nav>
            <div class="sidebar-upload">
                <a href="/index.html" class="btn-upload">Upload Note</a>
            </div>
        </aside>
    `;
    
    // Insert sidebar after header
    const header = document.querySelector('.global-header');
    if (header) {
        header.insertAdjacentHTML('afterend', sidebarHTML);
    } else {
        document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
    }
    
    // Add sidebar styles if not already present
    if (!document.getElementById('global-sidebar-styles')) {
        const style = document.createElement('style');
        style.id = 'global-sidebar-styles';
        style.textContent = `
            .global-sidebar {
                width: 260px;
                background: var(--panel);
                border-right: 1px solid rgba(255, 255, 255, 0.1);
                display: flex;
                flex-direction: column;
                padding: 24px 0;
                overflow-y: auto;
                position: fixed;
                left: 0;
                top: 72px;
                height: calc(100vh - 72px);
                z-index: 1001;
            }
            body {
                padding-top: 72px;
            }
            .sidebar-nav {
                flex: 1;
            }
            .sidebar-nav a {
                display: block;
                padding: 14px 24px;
                color: var(--text);
                text-decoration: none;
                transition: all 0.2s;
                font-size: 0.95em;
                font-weight: 500;
                border-left: 3px solid transparent;
            }
            .sidebar-nav a:hover {
                background: var(--input-bg);
                border-left-color: var(--accent);
                color: var(--accent);
            }
            .sidebar-nav a.active {
                background: var(--input-bg);
                border-left-color: var(--accent);
                color: var(--accent);
            }
            .sidebar-upload {
                padding: 24px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                margin-top: auto;
            }
            .btn-upload {
                width: 100%;
                background: var(--accent);
                color: #000000;
                border: none;
                padding: 14px 24px;
                font-size: 1em;
                font-weight: 700;
                border-radius: 8px;
                cursor: pointer;
                text-decoration: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                transition: all 0.3s;
                box-shadow: 0 4px 16px rgba(0, 255, 133, 0.4);
            }
            .btn-upload:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 24px rgba(0, 255, 133, 0.6);
            }
            .btn-upload::before {
                content: '+';
                font-size: 1.3em;
                font-weight: 800;
            }
            .main-content-with-sidebar {
                margin-left: 260px;
                transition: margin-left 0.3s;
            }
            @media (max-width: 768px) {
                .global-sidebar {
                    width: 100%;
                    border-right: none;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    max-height: 200px;
                    position: relative;
                    top: 0;
                    height: auto;
                }
                .sidebar-nav {
                    display: flex;
                    overflow-x: auto;
                }
                .sidebar-nav a {
                    white-space: nowrap;
                    border-left: none;
                    border-bottom: 3px solid transparent;
                }
                .sidebar-nav a.active {
                    border-left: none;
                    border-bottom-color: var(--accent);
                }
                .sidebar-upload {
                    display: none;
                }
                .main-content-with-sidebar {
                    margin-left: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Adjust main content to account for sidebar
    adjustMainContentForSidebar();
    
    // Add sidebar event listeners
    setupSidebarListeners();
}

/**
 * Adjust main content margin for sidebar
 */
function adjustMainContentForSidebar() {
    // Find main content containers
    const mainSelectors = [
        '.main-content',
        '.container',
        'main',
        '#main-content'
    ];
    
    let mainContent = null;
    for (const selector of mainSelectors) {
        const elements = document.querySelectorAll(selector);
        // Prefer elements that are direct children of body or have substantial content
        for (const el of elements) {
            if (el.parentElement === document.body || el.offsetHeight > 100) {
                mainContent = el;
                break;
            }
        }
        if (mainContent) break;
    }
    
    // If no suitable container found, wrap body content
    if (!mainContent) {
        const bodyChildren = Array.from(document.body.children);
        const contentElements = bodyChildren.filter(el => 
            !el.classList.contains('global-header') && 
            !el.classList.contains('global-sidebar') &&
            el.tagName !== 'SCRIPT'
        );
        
        if (contentElements.length > 0) {
            const wrapper = document.createElement('div');
            wrapper.className = 'main-content-with-sidebar';
            contentElements.forEach(el => wrapper.appendChild(el));
            document.body.appendChild(wrapper);
            return;
        }
    }
    
    if (mainContent && !mainContent.classList.contains('main-content-with-sidebar')) {
        mainContent.classList.add('main-content-with-sidebar');
    }
}

/**
 * Setup header event listeners
 */
function setupHeaderListeners() {
    const profileIcon = document.getElementById('profile-icon');
    const profileDropdown = document.getElementById('profile-dropdown');
    const searchInput = document.getElementById('header-search-input');
    
    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('open');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('open');
            }
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    window.location.href = `/list.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
    
    // Logout handler
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.cookie = 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            window.location.href = '/home.html';
        });
    }
    
    // Settings handler
    const settingsLink = document.getElementById('settings-link');
    if (settingsLink) {
        settingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Settings page coming soon!');
        });
    }
}

/**
 * Setup sidebar event listeners
 */
function setupSidebarListeners() {
    // Mark active page
    const currentPath = window.location.pathname;
    document.querySelectorAll('.sidebar-link').forEach(link => {
        const href = link.getAttribute('href');
        // Remove active class first
        link.classList.remove('active');
        // Check if this link matches current page
        if (currentPath === href || 
            (currentPath === '/' && href === '/list.html') ||
            (currentPath.includes('seller-dashboard') && href.includes('seller-dashboard')) ||
            (currentPath.includes('my-vault') && href.includes('my-vault'))) {
            link.classList.add('active');
        }
    });
    
    // Handle protected links (My Vault, Earnings)
    document.querySelectorAll('.sidebar-link[data-page="vault"], .sidebar-link[data-page="earnings"]').forEach(link => {
        link.addEventListener('click', async (e) => {
            const user = await checkAuth();
            if (!user) {
                e.preventDefault();
                window.location.href = '/login.html';
            }
        });
    });
}

/**
 * Update sidebar based on auth status
 */
async function updateSidebarAuth() {
    const user = await checkAuth();
    const vaultLink = document.querySelector('.sidebar-link[data-page="vault"]');
    const earningsLink = document.querySelector('.sidebar-link[data-page="earnings"]');
    
    // Links are always visible, but will redirect to login if not authenticated
    // (handled in setupSidebarListeners)
}

/**
 * Update header profile icon
 */
async function updateHeaderProfile() {
    const profileIcon = document.getElementById('profile-icon');
    if (!profileIcon) return;
    
    try {
        const user = await checkAuth();
        if (user && user.name) {
            const initial = user.name.charAt(0).toUpperCase();
            profileIcon.textContent = initial;
            profileIcon.classList.remove('login-btn');
            
            // Show dropdown menu
            const dropdown = document.getElementById('profile-dropdown');
            if (dropdown) {
                dropdown.innerHTML = `
                    <a href="#" id="settings-link">Settings</a>
                    <a href="#" id="logout-link">Logout</a>
                `;
                setupHeaderListeners(); // Re-setup listeners for new elements
            }
        } else {
            // Not logged in - show login button
            profileIcon.textContent = 'Login';
            profileIcon.classList.add('login-btn');
            profileIcon.onclick = () => {
                window.location.href = '/login.html';
            };
            
            // Hide dropdown
            const dropdown = document.getElementById('profile-dropdown');
            if (dropdown) {
                dropdown.style.display = 'none';
            }
        }
    } catch (e) {
        console.error('Error updating header profile:', e);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalLayout);
} else {
    initGlobalLayout();
}

