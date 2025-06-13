// Main Application
class SocialMediaApp {
    constructor() {
        this.initialized = false;
        this.startTime = Date.now();
    }
    
    // Initialize the application
    async init() {
        try {
            Utils.log('info', 'Initializing Social Media Manager...');
            
            // Show loading state
            this.showInitialLoading(true);
            
            // Initialize core managers
            await this.initializeManagers();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Initialize theme
            this.initializeTheme();
            
            // Check for updates
            this.checkForUpdates();
            
            // Mark as initialized
            this.initialized = true;
            
            // Hide loading state
            this.showInitialLoading(false);
            
            // Log initialization complete
            const initTime = Date.now() - this.startTime;
            Utils.log('info', `Application initialized in ${initTime}ms`);
            
            // Dispatch ready event
            this.dispatchReadyEvent();
            
        } catch (error) {
            Utils.log('error', 'Application initialization failed:', error);
            this.handleInitializationError(error);
        }
    }
    
    // Initialize all managers
    async initializeManagers() {
        // Initialize toast manager first (needed by others)
        toastManager.init();
        
        // Initialize authentication manager
        authManager.init();
        
        // Initialize page manager
        pageManager.init();
        
        // Initialize profile manager
        profileManager.init();
        
        // Initialize analytics manager
        analyticsManager.init();
        
        // Initialize settings manager
        settingsManager.init();
        
        Utils.log('debug', 'All managers initialized');
    }
    
    // Setup global event listeners
    setupGlobalEventListeners() {
        // Handle online/offline status
        window.addEventListener('online', this.handleOnlineStatus.bind(this));
        window.addEventListener('offline', this.handleOfflineStatus.bind(this));
        
        // Handle visibility change (tab focus/blur)
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        
        // Handle unload (page close/refresh)
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // Handle errors
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
        
        // Handle authentication state changes
        document.addEventListener('authStateChanged', this.handleAuthStateChange.bind(this));
        
        // Handle page changes
        document.addEventListener('pageChanged', this.handlePageChange.bind(this));
        
        Utils.log('debug', 'Global event listeners setup complete');
    }
    
    // Initialize theme
    initializeTheme() {
        const savedTheme = settingsManager.getTheme();
        settingsManager.applyTheme(savedTheme);
        
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                if (settingsManager.getTheme() === 'auto') {
                    settingsManager.applyTheme('auto');
                }
            });
        }
    }
    
    // Check for application updates
    checkForUpdates() {
        // In a real application, this would check for new versions
        // For now, just log that we're checking
        Utils.log('debug', 'Checking for updates...');
        
        // Simulate update check
        setTimeout(() => {
            Utils.log('debug', 'Application is up to date');
        }, 1000);
    }
    
    // Handle online status
    handleOnlineStatus() {
        Utils.log('info', 'Application is online');
        toastManager.show('Connection restored', 'success');
        
        // Refresh current page data if authenticated
        if (authManager.isAuthenticated) {
            pageManager.refreshCurrentPage();
        }
    }
    
    // Handle offline status
    handleOfflineStatus() {
        Utils.log('warn', 'Application is offline');
        toastManager.show('Connection lost. Some features may not work.', 'warning');
    }
    
    // Handle visibility change
    handleVisibilityChange() {
        if (document.hidden) {
            Utils.log('debug', 'Application hidden');
        } else {
            Utils.log('debug', 'Application visible');
            
            // Refresh data when returning to tab (if authenticated)
            if (authManager.isAuthenticated) {
                this.refreshDataOnFocus();
            }
        }
    }
    
    // Refresh data when tab becomes visible
    refreshDataOnFocus() {
        const lastActivity = Utils.storage.get('last_activity');
        const now = Date.now();
        
        // Only refresh if it's been more than 5 minutes
        if (!lastActivity || (now - lastActivity) > 5 * 60 * 1000) {
            pageManager.refreshCurrentPage();
            Utils.storage.set('last_activity', now);
        }
    }
    
    // Handle before unload
    handleBeforeUnload(event) {
        // Save current state
        Utils.storage.set('last_activity', Date.now());
        Utils.storage.set('last_page', pageManager.getCurrentPage());
        
        // Don't show confirmation dialog unless there are unsaved changes
        // event.preventDefault();
        // event.returnValue = '';
    }
    
    // Handle global errors
    handleGlobalError(event) {
        Utils.log('error', 'Global error:', event.error);
        
        // Show user-friendly error message
        toastManager.show('An unexpected error occurred', 'error');
        
        // Report error (in production, this would send to error tracking service)
        this.reportError(event.error);
    }
    
    // Handle unhandled promise rejections
    handleUnhandledRejection(event) {
        Utils.log('error', 'Unhandled promise rejection:', event.reason);
        
        // Prevent default browser behavior
        event.preventDefault();
        
        // Show user-friendly error message
        toastManager.show('A network or processing error occurred', 'error');
        
        // Report error
        this.reportError(event.reason);
    }
    
    // Handle keyboard shortcuts
    handleKeyboardShortcuts(event) {
        // Only handle shortcuts when not typing in input fields
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Ctrl/Cmd + K: Focus search
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            const searchField = Utils.dom.get('searchFilter');
            if (searchField) {
                searchField.focus();
            }
        }
        
        // Escape: Close modals
        if (event.key === 'Escape') {
            this.closeAllModals();
        }
        
        // Ctrl/Cmd + R: Refresh current page
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            pageManager.refreshCurrentPage();
        }
        
        // Number keys: Navigate to pages (1-4)
        if (event.key >= '1' && event.key <= '4' && !event.ctrlKey && !event.metaKey) {
            const pages = ['dashboard', 'profiles', 'analytics', 'settings'];
            const pageIndex = parseInt(event.key) - 1;
            if (pages[pageIndex]) {
                pageManager.showPage(pages[pageIndex]);
            }
        }
    }
    
    // Handle authentication state changes
    handleAuthStateChange(event) {
        const { isAuthenticated } = event.detail;
        Utils.log('debug', `Auth state changed: ${isAuthenticated}`);
        
        // Update UI based on auth state
        this.updateUIForAuthState(isAuthenticated);
    }
    
    // Handle page changes
    handlePageChange(event) {
        const { page } = event.detail;
        Utils.log('debug', `Page changed to: ${page}`);
        
        // Update analytics or tracking here
        this.trackPageView(page);
    }
    
    // Update UI for authentication state
    updateUIForAuthState(isAuthenticated) {
        // This is handled by individual managers, but we could add
        // global UI updates here if needed
    }
    
    // Track page views (for analytics)
    trackPageView(page) {
        // In a real application, this would send to analytics service
        Utils.log('debug', `Page view tracked: ${page}`);
    }
    
    // Close all open modals
    closeAllModals() {
        const modals = Utils.dom.getAll('.modal.show');
        modals.forEach(modal => {
            Utils.dom.removeClass(modal, 'show');
        });
    }
    
    // Report errors to tracking service
    reportError(error) {
        // In production, this would send to error tracking service like Sentry
        const errorReport = {
            message: error.message,
            stack: error.stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            userId: authManager.getCurrentUser()?.id,
            page: pageManager.getCurrentPage()
        };
        
        Utils.log('debug', 'Error report:', errorReport);
    }
    
    // Show initial loading state
    showInitialLoading(show) {
        const loadingOverlay = Utils.dom.get('loadingOverlay');
        if (loadingOverlay) {
            if (show) {
                Utils.dom.addClass(loadingOverlay, 'show');
            } else {
                Utils.dom.removeClass(loadingOverlay, 'show');
            }
        }
    }
    
    // Handle initialization error
    handleInitializationError(error) {
        Utils.log('error', 'Initialization error:', error);
        
        // Hide loading overlay
        this.showInitialLoading(false);
        
        // Show error message
        document.body.innerHTML = `
            <div class="init-error">
                <div class="init-error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h1>Application Failed to Load</h1>
                    <p>We're sorry, but the application failed to initialize properly.</p>
                    <p class="error-details">${Utils.string.escapeHtml(error.message)}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        <i class="fas fa-refresh"></i>
                        Reload Application
                    </button>
                </div>
            </div>
        `;
    }
    
    // Dispatch application ready event
    dispatchReadyEvent() {
        const event = new CustomEvent('appReady', {
            detail: {
                initTime: Date.now() - this.startTime,
                version: CONFIG.VERSION,
                timestamp: new Date().toISOString()
            }
        });
        document.dispatchEvent(event);
    }
    
    // Get application status
    getStatus() {
        return {
            initialized: this.initialized,
            online: navigator.onLine,
            authenticated: authManager.isAuthenticated,
            currentPage: pageManager.getCurrentPage(),
            uptime: Date.now() - this.startTime,
            version: CONFIG.VERSION
        };
    }
    
    // Restart application
    restart() {
        Utils.log('info', 'Restarting application...');
        window.location.reload();
    }
    
    // Shutdown application
    shutdown() {
        Utils.log('info', 'Shutting down application...');
        
        // Save current state
        Utils.storage.set('last_activity', Date.now());
        Utils.storage.set('last_page', pageManager.getCurrentPage());
        
        // Logout user
        if (authManager.isAuthenticated) {
            authManager.logout();
        }
        
        // Clear any intervals/timeouts
        // (would be implemented if we had any)
        
        Utils.log('info', 'Application shutdown complete');
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    // Create global app instance
    window.app = new SocialMediaApp();
    
    // Initialize the application
    await window.app.init();
});

// Handle app ready event
document.addEventListener('appReady', (event) => {
    Utils.log('info', 'Application ready!', event.detail);
    
    // Show welcome message for first-time users
    const isFirstVisit = !Utils.storage.get('has_visited');
    if (isFirstVisit) {
        setTimeout(() => {
            toastManager.show('Welcome to Social Media Manager!', 'info');
            Utils.storage.set('has_visited', true);
        }, 1000);
    }
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SocialMediaApp;
}