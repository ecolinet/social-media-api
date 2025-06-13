// Authentication Manager
const AuthManager = {
    // Current user data
    currentUser: null,
    
    // Authentication state
    isAuthenticated: false,
    
    // Initialize authentication
    init() {
        this.checkAuthState();
        this.setupEventListeners();
    },
    
    // Check current authentication state
    checkAuthState() {
        const token = ApiService.getToken();
        const userData = Utils.storage.get(CONFIG.STORAGE_KEYS.USER_DATA);
        
        if (token && userData) {
            this.currentUser = userData;
            this.isAuthenticated = true;
            this.updateUI(true);
            
            // Verify token is still valid
            this.verifyToken();
        } else {
            this.updateUI(false);
        }
    },
    
    // Verify token validity
    async verifyToken() {
        try {
            const response = await ApiService.auth.getUser();
            if (response.success) {
                this.currentUser = response.data.data.user;
                Utils.storage.set(CONFIG.STORAGE_KEYS.USER_DATA, this.currentUser);
                this.updateUI(true);
            }
        } catch (error) {
            Utils.log('warn', 'Token verification failed:', error);
            this.logout();
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Login form submission
        const loginForm = Utils.dom.get('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
        
        // Close modal on outside click
        const loginModal = Utils.dom.get('loginModal');
        if (loginModal) {
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    this.hideLoginModal();
                }
            });
        }
        
        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideLoginModal();
            }
        });
    },
    
    // Handle login form submission
    async handleLogin() {
        const email = Utils.dom.get('email').value.trim();
        const password = Utils.dom.get('password').value;
        
        // Validate input
        if (!email || !password) {
            this.showToast('Please enter both email and password', 'error');
            return;
        }
        
        if (!Utils.validate.email(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            
            const response = await ApiService.auth.login({ email, password });
            
            if (response.success && response.data.success) {
                const { user, access_token } = response.data.data;
                
                // Store authentication data
                ApiService.setToken(access_token);
                Utils.storage.set(CONFIG.STORAGE_KEYS.USER_DATA, user);
                
                // Update state
                this.currentUser = user;
                this.isAuthenticated = true;
                
                // Update UI
                this.updateUI(true);
                this.hideLoginModal();
                
                // Show success message
                this.showToast(CONFIG.SUCCESS_MESSAGES.LOGIN_SUCCESS, 'success');
                
                // Refresh current page data
                if (window.pageManager) {
                    window.pageManager.refreshCurrentPage();
                }
                
            } else {
                throw new Error(response.data.message || 'Login failed');
            }
            
        } catch (error) {
            Utils.log('error', 'Login error:', error);
            this.showToast(error.message || CONFIG.ERROR_MESSAGES.UNKNOWN_ERROR, 'error');
        } finally {
            this.showLoading(false);
        }
    },
    
    // Logout user
    async logout() {
        try {
            // Call logout endpoint if authenticated
            if (this.isAuthenticated) {
                await ApiService.auth.logout().catch(error => {
                    Utils.log('warn', 'Logout API call failed:', error);
                });
            }
        } catch (error) {
            Utils.log('warn', 'Logout error:', error);
        } finally {
            // Clear local data regardless of API call result
            ApiService.removeToken();
            Utils.storage.remove(CONFIG.STORAGE_KEYS.USER_DATA);
            
            // Update state
            this.currentUser = null;
            this.isAuthenticated = false;
            
            // Update UI
            this.updateUI(false);
            
            // Show success message
            this.showToast(CONFIG.SUCCESS_MESSAGES.LOGOUT_SUCCESS, 'success');
            
            // Redirect to dashboard
            if (window.pageManager) {
                window.pageManager.showPage('dashboard');
            }
        }
    },
    
    // Handle unauthorized response
    handleUnauthorized() {
        this.logout();
        this.showLoginModal();
        this.showToast(CONFIG.ERROR_MESSAGES.UNAUTHORIZED, 'error');
    },
    
    // Show login modal
    showLoginModal() {
        const modal = Utils.dom.get('loginModal');
        if (modal) {
            Utils.dom.addClass(modal, 'show');
            
            // Focus on email field
            const emailField = Utils.dom.get('email');
            if (emailField) {
                setTimeout(() => emailField.focus(), 100);
            }
        }
    },
    
    // Hide login modal
    hideLoginModal() {
        const modal = Utils.dom.get('loginModal');
        if (modal) {
            Utils.dom.removeClass(modal, 'show');
            
            // Clear form
            const form = Utils.dom.get('loginForm');
            if (form) {
                form.reset();
                // Restore demo credentials
                Utils.dom.get('email').value = CONFIG.DEMO_CREDENTIALS.email;
                Utils.dom.get('password').value = CONFIG.DEMO_CREDENTIALS.password;
            }
        }
    },
    
    // Update UI based on authentication state
    updateUI(isAuthenticated) {
        const loginBtn = Utils.dom.get('loginBtn');
        const userInfo = Utils.dom.get('userInfo');
        const userName = Utils.dom.get('userName');
        
        if (isAuthenticated && this.currentUser) {
            // Show user info, hide login button
            if (loginBtn) Utils.dom.hide(loginBtn);
            if (userInfo) Utils.dom.show(userInfo);
            if (userName) userName.textContent = this.currentUser.name;
            
            // Enable authenticated features
            this.enableAuthenticatedFeatures();
            
        } else {
            // Show login button, hide user info
            if (loginBtn) Utils.dom.show(loginBtn);
            if (userInfo) Utils.dom.hide(userInfo);
            
            // Disable authenticated features
            this.disableAuthenticatedFeatures();
        }
    },
    
    // Enable features that require authentication
    enableAuthenticatedFeatures() {
        // Enable navigation items that require auth
        const navItems = Utils.dom.getAll('.nav-item[data-page="profiles"], .nav-item[data-page="analytics"]');
        navItems.forEach(item => {
            item.disabled = false;
            Utils.dom.removeClass(item, 'disabled');
        });
        
        // Enable action buttons
        const actionButtons = Utils.dom.getAll('.btn[onclick*="profileManager"], .btn[onclick*="authManager.logout"]');
        actionButtons.forEach(btn => {
            btn.disabled = false;
        });
    },
    
    // Disable features that require authentication
    disableAuthenticatedFeatures() {
        // Disable navigation items that require auth
        const navItems = Utils.dom.getAll('.nav-item[data-page="profiles"], .nav-item[data-page="analytics"]');
        navItems.forEach(item => {
            item.disabled = true;
            Utils.dom.addClass(item, 'disabled');
        });
        
        // Disable action buttons
        const actionButtons = Utils.dom.getAll('.btn[onclick*="profileManager"]');
        actionButtons.forEach(btn => {
            btn.disabled = true;
        });
    },
    
    // Check if user is authenticated
    requireAuth() {
        if (!this.isAuthenticated) {
            this.showLoginModal();
            return false;
        }
        return true;
    },
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    },
    
    // Show loading state
    showLoading(show) {
        const overlay = Utils.dom.get('loadingOverlay');
        if (overlay) {
            if (show) {
                Utils.dom.addClass(overlay, 'show');
            } else {
                Utils.dom.removeClass(overlay, 'show');
            }
        }
    },
    
    // Show toast notification
    showToast(message, type = 'info') {
        if (window.toastManager) {
            window.toastManager.show(message, type);
        } else {
            // Fallback to alert if toast manager not available
            alert(message);
        }
    }
};

// Toast Manager
const ToastManager = {
    container: null,
    
    // Initialize toast manager
    init() {
        this.container = Utils.dom.get('toastContainer');
        if (!this.container) {
            this.container = Utils.dom.create('div', { 
                id: 'toastContainer', 
                className: 'toast-container' 
            });
            document.body.appendChild(this.container);
        }
    },
    
    // Show toast notification
    show(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
        if (!this.container) this.init();
        
        const toast = Utils.dom.create('div', {
            className: `toast ${type}`
        });
        
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas ${this.getIcon(type)}"></i>
                <span>${Utils.string.escapeHtml(message)}</span>
            </div>
        `;
        
        this.container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => Utils.dom.addClass(toast, 'show'), 10);
        
        // Auto remove
        setTimeout(() => this.remove(toast), duration);
        
        // Click to remove
        toast.addEventListener('click', () => this.remove(toast));
    },
    
    // Remove toast
    remove(toast) {
        if (toast && toast.parentNode) {
            Utils.dom.removeClass(toast, 'show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    },
    
    // Get icon for toast type
    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
};

// Make managers globally available
window.authManager = AuthManager;
window.toastManager = ToastManager;