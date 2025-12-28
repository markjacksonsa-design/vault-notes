// Global Layout System - Simple and consistent sidebar and header

/**
 * Check if current page should show sidebar
 */
function shouldShowSidebar() {
    const path = window.location.pathname;
    // Show sidebar on app pages, hide on home page
    const appPages = ['/list.html', '/browse.html', '/my-vault.html', '/vault.html', '/seller-dashboard.html', '/earnings.html', '/profile.html', '/profile', '/upload.html'];
    const homePages = ['/', '/index.html', '/home.html'];
    
    // Don't show sidebar on home pages
    if (homePages.some(page => path === page || path === page.replace('.html', ''))) {
        return false;
    }
    
    return appPages.some(page => path.includes(page) || path === page.replace('.html', ''));
}

/**
 * Initialize global layout (sidebar and header)
 */
async function initGlobalLayout() {
    // Inject header if it doesn't exist
    if (!document.querySelector('.global-header')) {
        injectGlobalHeader();
    }
    
    // Inject sidebar only on app pages
    const showSidebar = shouldShowSidebar();
    if (showSidebar && !document.querySelector('.global-sidebar')) {
        injectGlobalSidebar();
    }
    
    // Update sidebar based on auth status
    await updateSidebarAuth();
    
    // Update header profile icon
    await updateHeaderProfile();
    
    // Adjust main content for sidebar
    if (showSidebar) {
        adjustMainContentForSidebar();
    }
}

/**
 * Inject global header with search and profile/login
 */
function injectGlobalHeader() {
    const path = window.location.pathname;
    const isHomePage = path === '/' || path === '/index.html' || path === '/home.html';
    
    const headerHTML = isHomePage ? `
        <header class="global-header home-header">
            <a href="/" class="header-logo">
                <span class="logo-text">NoteVault</span> <span class="logo-sa">SA</span>
            </a>
            <div class="profile-container">
                <div class="profile-icon" id="profile-icon">Login</div>
                <div class="profile-dropdown" id="profile-dropdown" style="display: none;">
                    <a href="#" id="settings-link">Settings</a>
                    <a href="#" id="logout-link">Logout</a>
                </div>
            </div>
        </header>
    ` : `
        <header class="global-header">
            <a href="/" class="header-logo">
                <span class="logo-text">NoteVault</span> <span class="logo-sa">SA</span>
            </a>
            <div class="header-search">
                <input type="text" placeholder="Search notes..." id="header-search-input" class="header-search-input">
            </div>
            <div class="profile-container">
                <button class="profile-button" id="profile-button">
                    <span class="profile-text">Profile</span>
                    <span class="profile-bubble" id="profile-bubble">U</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div class="profile-dropdown" id="profile-dropdown">
                    <a href="/profile" id="profile-link">My Profile</a>
                    <a href="#" id="settings-link">Settings</a>
                    <a href="#" id="logout-link">Logout</a>
                </div>
            </div>
        </header>
    `;
    
    // Insert header at the beginning of body
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    
    // Add header styles
    if (!document.getElementById('global-header-styles')) {
        const style = document.createElement('style');
        style.id = 'global-header-styles';
        style.textContent = `
            .global-header {
                background: rgba(13, 13, 13, 0.95);
                backdrop-filter: blur(10px);
                padding: 16px 32px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                border-bottom: 2px solid var(--accent);
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                z-index: 1002;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 24px;
                height: 72px;
            }
            .global-header.home-header {
                justify-content: space-between;
            }
            .header-logo {
                font-size: 1.4em;
                font-weight: 700;
                text-decoration: none;
                font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
                letter-spacing: -0.5px;
            }
            .header-logo .logo-text {
                color: var(--text);
            }
            .header-logo .logo-sa {
                color: var(--accent);
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
                min-width: 100px;
                padding: 10px 20px;
                border-radius: 8px;
                background: var(--input-bg);
                color: var(--text);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.95em;
                transition: all 0.2s;
                border: 2px solid transparent;
            }
            .profile-icon:hover {
                background: var(--accent);
                color: var(--bg);
                border-color: var(--accent);
            }
            .profile-button {
                display: flex;
                align-items: center;
                gap: 8px;
                background: var(--input-bg);
                color: var(--text);
                border: 2px solid transparent;
                border-radius: 8px;
                padding: 8px 16px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.95em;
                transition: all 0.2s;
            }
            .profile-button:hover {
                background: var(--panel);
                border-color: var(--accent);
            }
            .profile-text {
                color: var(--text);
            }
            .profile-bubble {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: var(--accent);
                color: var(--bg);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 0.9em;
            }
            .dropdown-arrow {
                font-size: 0.7em;
                color: var(--subtitle);
                transition: transform 0.2s;
            }
            .profile-button.open .dropdown-arrow {
                transform: rotate(180deg);
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
            .profile-dropdown a:not(:last-child) {
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            body {
                padding-top: 72px;
            }
            @media (max-width: 768px) {
                .global-header {
                    padding: 12px 20px;
                    height: 64px;
                }
                body {
                    padding-top: 64px;
                }
                .header-logo {
                    font-size: 1.2em;
                }
                .header-search {
                    max-width: none;
                    flex: 1;
                }
                .profile-icon {
                    min-width: 80px;
                    padding: 8px 16px;
                    font-size: 0.85em;
                }
                .profile-button {
                    padding: 6px 12px;
                    font-size: 0.85em;
                }
                .profile-text {
                    display: none;
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
                <a href="/list.html" class="sidebar-link" data-page="browse">
                    <span class="sidebar-label">Browse</span>
                </a>
                <a href="/my-vault.html" class="sidebar-link" data-page="vault">
                    <span class="sidebar-label">My Vault</span>
                </a>
                <a href="/seller-dashboard.html" class="sidebar-link" data-page="earnings">
                    <span class="sidebar-label">Sales</span>
                </a>
                <a href="/profile" class="sidebar-link" data-page="profile">
                    <span class="sidebar-label">Profile</span>
                </a>
            </nav>
            <div class="sidebar-upload">
                <a href="/upload.html" class="btn-upload">Upload Note</a>
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
    
    // Add sidebar styles
    if (!document.getElementById('global-sidebar-styles')) {
        const style = document.createElement('style');
        style.id = 'global-sidebar-styles';
        style.textContent = `
            :root {
                --bg: #0D0D0D;
                --panel: #1A1A1A;
                --input-bg: #1A1A1A;
                --accent: #00FF85;
                --text: #FFFFFF;
                --subtitle: #E0E0E0;
            }
            /* Utility Classes for Common Inline Styles */
            .hidden {
                display: none !important;
            }
            .text-accent {
                color: var(--accent);
            }
            .text-subtitle {
                color: var(--subtitle);
            }
            .font-weight-600 {
                font-weight: 600;
            }
            /* Fix Box Sizing - All elements use border-box */
            *, *::before, *::after {
                box-sizing: border-box;
            }
            /* Hide Horizontal Overflow - Safety Net */
            html, body {
                overflow-x: hidden;
                width: 100%;
                max-width: 100%;
            }
            /* App Shell Structure */
            body {
                margin: 0;
                padding: 0;
                display: flex;
                min-height: 100vh;
            }
            /* Standardized App Container */
            .app-container {
                display: flex;
                width: 100%;
                min-height: 100vh;
            }
            /* Standardized Sidebar - Always 250px, Fixed */
            .global-sidebar {
                width: 250px;
                height: 100vh;
                background: var(--panel);
                border-right: 2px solid rgba(0, 255, 133, 0.15);
                box-shadow: 2px 0 8px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                padding: 20px 0;
                overflow-y: auto;
                position: fixed;
                left: 0;
                top: 0;
                z-index: 1001;
                flex-shrink: 0;
            }
            .sidebar-nav {
                flex: 1;
                padding: 8px 0;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .sidebar-nav a {
                display: flex;
                align-items: center;
                padding: 12px 20px;
                color: var(--text);
                text-decoration: none;
                transition: all 0.2s;
                font-size: 0.95em;
                font-weight: 500;
                border-left: 3px solid transparent;
                margin: 0 8px;
                border-radius: 6px;
            }
            .sidebar-label {
                flex: 1;
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
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(0, 255, 133, 0.15);
            }
            .sidebar-upload {
                padding: 16px 16px 20px 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                margin-top: auto;
                display: flex;
                justify-content: center;
            }
            .btn-upload {
                max-width: 90%;
                background: var(--accent);
                color: #000000;
                border: none;
                padding: 8px 12px;
                font-size: 0.75em;
                font-weight: 500;
                border-radius: 4px;
                cursor: pointer;
                text-decoration: none;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                transition: all 0.3s;
                box-shadow: 0 1px 4px rgba(0, 255, 133, 0.2);
            }
            .btn-upload:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 6px rgba(0, 255, 133, 0.4);
                background: #00e677;
            }
            .btn-upload::before {
                content: '+';
                font-size: 0.85em;
                font-weight: 600;
            }
            /* Standardized Main Content - Always margin-left: 250px, width: calc(100% - 250px) */
            .main-content-with-sidebar,
            .app-main-content,
            .main-body,
            .main-content {
                margin-left: 250px;
                width: calc(100% - 250px);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                flex: 1;
            }
            /* Ensure all main content areas respect sidebar */
            body:has(.global-sidebar) > main,
            body:has(.global-sidebar) > .main-content,
            body:has(.global-sidebar) > .container,
            body:has(.global-sidebar) > #app-container > .main-body {
                margin-left: 250px;
                width: calc(100% - 250px);
            }
            @media (max-width: 768px) {
                .global-sidebar {
                    width: 100%;
                    border-right: none;
                    border-bottom: 2px solid rgba(0, 255, 133, 0.15);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    max-height: 200px;
                    position: relative;
                    top: 0;
                    height: auto;
                    z-index: 1000;
                }
                .sidebar-nav {
                    display: flex;
                    flex-direction: row;
                    overflow-x: auto;
                    gap: 0;
                }
                .sidebar-nav a {
                    white-space: nowrap;
                    border-left: none;
                    border-bottom: 3px solid transparent;
                    margin: 0 4px;
                    padding: 12px 16px;
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
                body {
                    padding-top: 64px;
                }
                .btn-upload {
                    max-width: 100%;
                    box-sizing: border-box;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
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
    const profileButton = document.getElementById('profile-button');
    const profileIcon = document.getElementById('profile-icon');
    const profileDropdown = document.getElementById('profile-dropdown');
    const searchInput = document.getElementById('header-search-input');
    
    // Handle profile button (app pages)
    if (profileButton && profileDropdown) {
        profileButton.addEventListener('click', (e) => {
            e.stopPropagation();
            profileButton.classList.toggle('open');
            profileDropdown.classList.toggle('open');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileButton.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileButton.classList.remove('open');
                profileDropdown.classList.remove('open');
            }
        });
    }
    
    // Handle profile icon (home page)
    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            // Only show dropdown if logged in
            if (profileIcon.classList.contains('logged-in')) {
                profileDropdown.classList.toggle('open');
            } else {
                // Redirect to login if not logged in
                window.location.href = '/login.html';
            }
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
            window.location.href = '/';
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
        const dataPage = link.getAttribute('data-page');
        link.classList.remove('active');
        
        // Check for Browse page (list.html, browse.html, or /browse)
        if (dataPage === 'browse') {
            if (currentPath === href || 
                currentPath === '/list.html' || 
                currentPath === '/browse.html' || 
                currentPath === '/browse' ||
                (currentPath === '/' && href === '/list.html')) {
                link.classList.add('active');
            }
        }
        // Check for other pages
        else if (currentPath === href || 
            (currentPath === '/' && href === '/list.html') ||
            (currentPath.includes('seller-dashboard') && href.includes('seller-dashboard')) ||
            (currentPath.includes('my-vault') && href.includes('my-vault')) ||
            (currentPath.includes('profile') && href.includes('profile'))) {
            link.classList.add('active');
        }
    });
    
    // Handle protected links (My Vault, Earnings, Profile)
    document.querySelectorAll('.sidebar-link[data-page="vault"], .sidebar-link[data-page="earnings"], .sidebar-link[data-page="profile"]').forEach(link => {
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
    // Links are always visible, but will redirect to login if not authenticated
    // (handled in setupSidebarListeners)
}

/**
 * Update header profile icon/button
 */
async function updateHeaderProfile() {
    const profileButton = document.getElementById('profile-button');
    const profileBubble = document.getElementById('profile-bubble');
    const profileIcon = document.getElementById('profile-icon');
    
    try {
        const user = await checkAuth();
        if (user && user.name) {
            const initial = user.name.charAt(0).toUpperCase();
            
            // Update app page profile button
            if (profileBubble) {
                profileBubble.textContent = initial;
            }
            
            // Update home page profile icon
            if (profileIcon) {
                profileIcon.textContent = initial;
                profileIcon.classList.add('logged-in');
                
                // Show dropdown menu
                const dropdown = document.getElementById('profile-dropdown');
                if (dropdown) {
                    dropdown.style.display = 'block';
                }
            }
        } else {
            // Not logged in
            if (profileBubble) {
                profileBubble.textContent = '?';
            }
            
            if (profileIcon) {
                profileIcon.textContent = 'Login';
                profileIcon.classList.remove('logged-in');
                
                // Hide dropdown
                const dropdown = document.getElementById('profile-dropdown');
                if (dropdown) {
                    dropdown.style.display = 'none';
                }
            }
        }
    } catch (e) {
        console.error('Error updating header profile:', e);
        if (profileIcon) {
            profileIcon.textContent = 'Login';
            profileIcon.classList.remove('logged-in');
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalLayout);
} else {
    initGlobalLayout();
}
