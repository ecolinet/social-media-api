// Page Manager
const PageManager = {
    // Current active page
    currentPage: 'dashboard',
    
    // Page configurations
    pages: {
        dashboard: {
            title: 'Dashboard',
            requiresAuth: false,
            onShow: () => {
                if (authManager.isAuthenticated) {
                    profileManager.loadRecentProfiles();
                    profileManager.updateStats();
                }
            }
        },
        profiles: {
            title: 'Profiles',
            requiresAuth: true,
            onShow: () => {
                profileManager.loadProfiles();
            }
        },
        analytics: {
            title: 'Analytics',
            requiresAuth: true,
            onShow: () => {
                analyticsManager.loadAnalytics();
            }
        },
        settings: {
            title: 'Settings',
            requiresAuth: true,
            onShow: () => {
                settingsManager.loadSettings();
            }
        }
    },
    
    // Initialize page manager
    init() {
        this.setupEventListeners();
        this.handleInitialRoute();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Navigation item clicks
        const navItems = Utils.dom.getAll('.nav-item[data-page]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.showPage(page);
            });
        });
        
        // Browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || this.getPageFromUrl();
            this.showPage(page, false);
        });
        
        // Handle authentication state changes
        document.addEventListener('authStateChanged', (e) => {
            this.handleAuthStateChange(e.detail.isAuthenticated);
        });
    },
    
    // Handle initial route
    handleInitialRoute() {
        const page = this.getPageFromUrl();
        this.showPage(page, false);
    },
    
    // Get page from URL
    getPageFromUrl() {
        const params = Utils.url.getParams();
        return params.page || 'dashboard';
    },
    
    // Show specific page
    showPage(pageName, updateUrl = true) {
        // Validate page exists
        if (!this.pages[pageName]) {
            Utils.log('warn', `Page "${pageName}" not found, redirecting to dashboard`);
            pageName = 'dashboard';
        }
        
        const pageConfig = this.pages[pageName];
        
        // Check authentication requirement
        if (pageConfig.requiresAuth && !authManager.isAuthenticated) {
            authManager.showLoginModal();
            return;
        }
        
        // Hide all pages
        const allPages = Utils.dom.getAll('.page');
        allPages.forEach(page => {
            Utils.dom.removeClass(page, 'active');
        });
        
        // Show target page
        const targetPage = Utils.dom.get(`${pageName}Page`);
        if (targetPage) {
            Utils.dom.addClass(targetPage, 'active');
        }
        
        // Update navigation
        this.updateNavigation(pageName);
        
        // Update URL
        if (updateUrl) {
            this.updateUrl(pageName);
        }
        
        // Update page title
        this.updatePageTitle(pageConfig.title);
        
        // Execute page-specific logic
        if (pageConfig.onShow) {
            try {
                pageConfig.onShow();
            } catch (error) {
                Utils.log('error', `Error showing page "${pageName}":`, error);
            }
        }
        
        // Update current page
        this.currentPage = pageName;
        
        // Dispatch page change event
        this.dispatchPageChangeEvent(pageName);
        
        Utils.log('debug', `Navigated to page: ${pageName}`);
    },
    
    // Update navigation active state
    updateNavigation(activePage) {
        const navItems = Utils.dom.getAll('.nav-item[data-page]');
        navItems.forEach(item => {
            const page = item.getAttribute('data-page');
            if (page === activePage) {
                Utils.dom.addClass(item, 'active');
            } else {
                Utils.dom.removeClass(item, 'active');
            }
        });
    },
    
    // Update URL without page reload
    updateUrl(page) {
        const url = new URL(window.location);
        
        if (page === 'dashboard') {
            url.searchParams.delete('page');
        } else {
            url.searchParams.set('page', page);
        }
        
        const state = { page };
        window.history.pushState(state, '', url);
    },
    
    // Update page title
    updatePageTitle(pageTitle) {
        document.title = `${pageTitle} - ${CONFIG.APP_NAME}`;
    },
    
    // Handle authentication state changes
    handleAuthStateChange(isAuthenticated) {
        // If user logged out and on a protected page, redirect to dashboard
        if (!isAuthenticated && this.pages[this.currentPage]?.requiresAuth) {
            this.showPage('dashboard');
        }
        
        // Update navigation state
        this.updateNavigationAuthState(isAuthenticated);
    },
    
    // Update navigation based on auth state
    updateNavigationAuthState(isAuthenticated) {
        const protectedNavItems = Utils.dom.getAll('.nav-item[data-page]');
        
        protectedNavItems.forEach(item => {
            const page = item.getAttribute('data-page');
            const pageConfig = this.pages[page];
            
            if (pageConfig?.requiresAuth) {
                if (isAuthenticated) {
                    item.disabled = false;
                    Utils.dom.removeClass(item, 'disabled');
                    item.style.opacity = '1';
                    item.style.pointerEvents = 'auto';
                } else {
                    item.disabled = true;
                    Utils.dom.addClass(item, 'disabled');
                    item.style.opacity = '0.5';
                    item.style.pointerEvents = 'none';
                }
            }
        });
    },
    
    // Refresh current page
    refreshCurrentPage() {
        const pageConfig = this.pages[this.currentPage];
        if (pageConfig?.onShow) {
            pageConfig.onShow();
        }
    },
    
    // Get current page name
    getCurrentPage() {
        return this.currentPage;
    },
    
    // Check if page requires authentication
    pageRequiresAuth(pageName) {
        return this.pages[pageName]?.requiresAuth || false;
    },
    
    // Navigate to previous page
    goBack() {
        window.history.back();
    },
    
    // Navigate to next page
    goForward() {
        window.history.forward();
    },
    
    // Dispatch page change event
    dispatchPageChangeEvent(pageName) {
        const event = new CustomEvent('pageChanged', {
            detail: {
                page: pageName,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    },
    
    // Add new page configuration
    addPage(pageName, config) {
        this.pages[pageName] = {
            title: config.title || Utils.string.capitalize(pageName),
            requiresAuth: config.requiresAuth || false,
            onShow: config.onShow || null,
            ...config
        };
        
        Utils.log('debug', `Added page configuration: ${pageName}`);
    },
    
    // Remove page configuration
    removePage(pageName) {
        if (this.pages[pageName]) {
            delete this.pages[pageName];
            Utils.log('debug', `Removed page configuration: ${pageName}`);
        }
    },
    
    // Get page breadcrumbs
    getBreadcrumbs() {
        const breadcrumbs = [
            { name: 'Home', page: 'dashboard' }
        ];
        
        if (this.currentPage !== 'dashboard') {
            const pageConfig = this.pages[this.currentPage];
            breadcrumbs.push({
                name: pageConfig?.title || Utils.string.capitalize(this.currentPage),
                page: this.currentPage
            });
        }
        
        return breadcrumbs;
    },
    
    // Render breadcrumbs
    renderBreadcrumbs(containerId) {
        const container = Utils.dom.get(containerId);
        if (!container) return;
        
        const breadcrumbs = this.getBreadcrumbs();
        
        container.innerHTML = breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            if (isLast) {
                return `<span class="breadcrumb-current">${crumb.name}</span>`;
            } else {
                return `<a href="#" class="breadcrumb-link" onclick="pageManager.showPage('${crumb.page}')">${crumb.name}</a>`;
            }
        }).join(' <i class="fas fa-chevron-right breadcrumb-separator"></i> ');
    },
    
    // Handle page loading states
    setPageLoading(pageName, isLoading) {
        const page = Utils.dom.get(`${pageName}Page`);
        if (!page) return;
        
        if (isLoading) {
            Utils.dom.addClass(page, 'loading');
        } else {
            Utils.dom.removeClass(page, 'loading');
        }
    },
    
    // Handle page errors
    setPageError(pageName, error) {
        const page = Utils.dom.get(`${pageName}Page`);
        if (!page) return;
        
        Utils.dom.addClass(page, 'error');
        
        // You could add error display logic here
        Utils.log('error', `Page error for ${pageName}:`, error);
    },
    
    // Clear page error state
    clearPageError(pageName) {
        const page = Utils.dom.get(`${pageName}Page`);
        if (!page) return;
        
        Utils.dom.removeClass(page, 'error');
    },
    
    // Get page statistics
    getPageStats() {
        return {
            totalPages: Object.keys(this.pages).length,
            protectedPages: Object.values(this.pages).filter(p => p.requiresAuth).length,
            currentPage: this.currentPage,
            isCurrentPageProtected: this.pageRequiresAuth(this.currentPage)
        };
    },
    
    // Preload page data
    async preloadPage(pageName) {
        const pageConfig = this.pages[pageName];
        if (!pageConfig) return;
        
        // Check auth requirement
        if (pageConfig.requiresAuth && !authManager.isAuthenticated) {
            return;
        }
        
        // Execute preload logic if available
        if (pageConfig.onPreload) {
            try {
                await pageConfig.onPreload();
                Utils.log('debug', `Preloaded page: ${pageName}`);
            } catch (error) {
                Utils.log('error', `Error preloading page "${pageName}":`, error);
            }
        }
    },
    
    // Preload all accessible pages
    async preloadAllPages() {
        const promises = Object.keys(this.pages).map(pageName => 
            this.preloadPage(pageName).catch(error => {
                Utils.log('warn', `Failed to preload page ${pageName}:`, error);
            })
        );
        
        await Promise.all(promises);
        Utils.log('debug', 'Finished preloading all pages');
    }
};

// Make PageManager globally available
window.pageManager = PageManager;