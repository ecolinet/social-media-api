// Settings Manager
const SettingsManager = {
    // Current settings
    settings: {},
    
    // Initialize settings
    init() {
        this.loadSettings();
        this.setupEventListeners();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Settings form submissions, theme toggles, etc.
        // Will be expanded as needed
    },
    
    // Load settings data
    async loadSettings() {
        if (!authManager.requireAuth()) return;
        
        try {
            this.showLoading(true);
            
            // Load user data
            const userResponse = await ApiService.auth.getUser();
            
            if (userResponse.success && userResponse.data.success) {
                this.settings.user = userResponse.data.data.user;
                this.renderAccountInfo();
            }
            
            // Load API information
            await this.loadApiInfo();
            
        } catch (error) {
            Utils.log('error', 'Load settings error:', error);
            this.showError('Failed to load settings: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    },
    
    // Load API information
    async loadApiInfo() {
        const apiBaseElement = Utils.dom.get('apiBaseUrl');
        if (apiBaseElement) {
            apiBaseElement.textContent = CONFIG.API_BASE_URL;
        }
        
        // Check API health
        await this.checkApiHealth();
    },
    
    // Check API health
    async checkApiHealth() {
        const statusElement = Utils.dom.get('apiStatus');
        
        if (statusElement) {
            statusElement.innerHTML = `
                <span class="api-status checking">
                    <i class="fas fa-spinner fa-spin"></i>
                    Checking...
                </span>
            `;
        }
        
        try {
            const response = await ApiService.utils.health();
            
            if (response.success && response.data.success) {
                if (statusElement) {
                    statusElement.innerHTML = `
                        <span class="api-status online">
                            <i class="fas fa-check-circle"></i>
                            Online
                        </span>
                    `;
                }
                
                // Store last health check
                this.settings.apiHealth = {
                    status: 'online',
                    timestamp: response.data.data.timestamp,
                    checkedAt: new Date().toISOString()
                };
                
            } else {
                throw new Error('API health check failed');
            }
            
        } catch (error) {
            Utils.log('error', 'API health check error:', error);
            
            if (statusElement) {
                statusElement.innerHTML = `
                    <span class="api-status offline">
                        <i class="fas fa-times-circle"></i>
                        Offline
                    </span>
                `;
            }
            
            this.settings.apiHealth = {
                status: 'offline',
                error: error.message,
                checkedAt: new Date().toISOString()
            };
        }
    },
    
    // Render account information
    renderAccountInfo() {
        const container = Utils.dom.get('accountInfo');
        if (!container || !this.settings.user) return;
        
        const user = this.settings.user;
        
        container.innerHTML = `
            <div class="account-info">
                <div class="account-field">
                    <span class="account-field-label">Name:</span>
                    <span class="account-field-value">${Utils.string.escapeHtml(user.name)}</span>
                </div>
                <div class="account-field">
                    <span class="account-field-label">Email:</span>
                    <span class="account-field-value">${Utils.string.escapeHtml(user.email)}</span>
                </div>
                <div class="account-field">
                    <span class="account-field-label">User ID:</span>
                    <span class="account-field-value">${user.id}</span>
                </div>
                <div class="account-field">
                    <span class="account-field-label">Member Since:</span>
                    <span class="account-field-value">${Utils.date.format(user.created_at, { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</span>
                </div>
            </div>
            
            <div class="account-actions">
                <button class="btn btn-outline" onclick="settingsManager.refreshAccountInfo()">
                    <i class="fas fa-refresh"></i>
                    Refresh Info
                </button>
                <button class="btn btn-outline" onclick="settingsManager.exportUserData()">
                    <i class="fas fa-download"></i>
                    Export Data
                </button>
            </div>
        `;
    },
    
    // Refresh account information
    async refreshAccountInfo() {
        try {
            this.showLoading(true);
            
            const response = await ApiService.auth.getUser();
            
            if (response.success && response.data.success) {
                this.settings.user = response.data.data.user;
                Utils.storage.set(CONFIG.STORAGE_KEYS.USER_DATA, this.settings.user);
                this.renderAccountInfo();
                this.showToast('Account information refreshed', 'success');
            } else {
                throw new Error(response.data.message || 'Failed to refresh account info');
            }
            
        } catch (error) {
            Utils.log('error', 'Refresh account info error:', error);
            this.showToast(error.message || 'Failed to refresh account info', 'error');
        } finally {
            this.showLoading(false);
        }
    },
    
    // Export user data
    async exportUserData() {
        if (!authManager.requireAuth()) return;
        
        try {
            this.showLoading(true);
            
            // Get all user data
            const [userResponse, profilesResponse] = await Promise.all([
                ApiService.auth.getUser(),
                ApiService.profiles.getAll()
            ]);
            
            const exportData = {
                export_info: {
                    generated_at: new Date().toISOString(),
                    app_name: CONFIG.APP_NAME,
                    app_version: CONFIG.VERSION
                },
                user: userResponse.success ? userResponse.data.data.user : null,
                profiles: profilesResponse.success ? profilesResponse.data.data.profiles : [],
                settings: this.getUserPreferences()
            };
            
            const filename = `social-media-data-${new Date().toISOString().split('T')[0]}.json`;
            const data = JSON.stringify(exportData, null, 2);
            
            Utils.downloadFile(data, filename, 'application/json');
            this.showToast('User data exported successfully', 'success');
            
        } catch (error) {
            Utils.log('error', 'Export user data error:', error);
            this.showToast(error.message || 'Failed to export user data', 'error');
        } finally {
            this.showLoading(false);
        }
    },
    
    // Get user preferences from local storage
    getUserPreferences() {
        return {
            theme: this.getTheme(),
            language: this.getLanguage(),
            notifications: this.getNotificationSettings(),
            lastLogin: Utils.storage.get('last_login'),
            preferences: Utils.storage.get(CONFIG.STORAGE_KEYS.PREFERENCES, {})
        };
    },
    
    // Theme management
    getTheme() {
        return Utils.storage.get('theme', 'auto');
    },
    
    setTheme(theme) {
        Utils.storage.set('theme', theme);
        this.applyTheme(theme);
        this.showToast(`Theme changed to ${theme}`, 'success');
    },
    
    applyTheme(theme) {
        const body = document.body;
        
        // Remove existing theme classes
        body.classList.remove('theme-light', 'theme-dark', 'theme-auto');
        
        if (theme === 'auto') {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
        } else {
            body.classList.add(`theme-${theme}`);
        }
    },
    
    // Language management
    getLanguage() {
        return Utils.storage.get('language', 'en');
    },
    
    setLanguage(language) {
        Utils.storage.set('language', language);
        // Language switching would be implemented here
        this.showToast(`Language changed to ${language}`, 'success');
    },
    
    // Notification settings
    getNotificationSettings() {
        return Utils.storage.get('notifications', {
            enabled: true,
            syncAlerts: true,
            errorAlerts: true,
            successAlerts: true
        });
    },
    
    setNotificationSettings(settings) {
        Utils.storage.set('notifications', settings);
        this.showToast('Notification settings updated', 'success');
    },
    
    // Clear all data
    async clearAllData() {
        if (!confirm('Are you sure you want to clear all local data? This will log you out and remove all cached information.')) {
            return;
        }
        
        try {
            // Clear local storage
            Utils.storage.clear();
            
            // Logout user
            await authManager.logout();
            
            this.showToast('All data cleared successfully', 'success');
            
            // Reload page to reset state
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } catch (error) {
            Utils.log('error', 'Clear data error:', error);
            this.showToast(error.message || 'Failed to clear data', 'error');
        }
    },
    
    // Get application information
    getAppInfo() {
        return {
            name: CONFIG.APP_NAME,
            version: CONFIG.VERSION,
            apiBaseUrl: CONFIG.API_BASE_URL,
            buildDate: new Date().toISOString(), // Would be set during build
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine
        };
    },
    
    // Render application information
    renderAppInfo() {
        const appInfo = this.getAppInfo();
        
        return `
            <div class="app-info">
                <h3>Application Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Application:</span>
                        <span class="info-value">${appInfo.name} v${appInfo.version}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">API Endpoint:</span>
                        <span class="info-value"><code>${appInfo.apiBaseUrl}</code></span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Browser:</span>
                        <span class="info-value">${this.getBrowserInfo()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Platform:</span>
                        <span class="info-value">${appInfo.platform}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Language:</span>
                        <span class="info-value">${appInfo.language}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Online Status:</span>
                        <span class="info-value">
                            <span class="status-badge ${appInfo.onlineStatus ? 'status-active' : 'status-inactive'}">
                                <i class="fas ${appInfo.onlineStatus ? 'fa-wifi' : 'fa-wifi-slash'}"></i>
                                ${appInfo.onlineStatus ? 'Online' : 'Offline'}
                            </span>
                        </span>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Get simplified browser information
    getBrowserInfo() {
        const ua = navigator.userAgent;
        
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        if (ua.includes('Opera')) return 'Opera';
        
        return 'Unknown';
    },
    
    // Debug information
    getDebugInfo() {
        return {
            config: CONFIG,
            localStorage: this.getLocalStorageInfo(),
            apiHealth: this.settings.apiHealth,
            authState: {
                isAuthenticated: authManager.isAuthenticated,
                hasToken: !!ApiService.getToken(),
                currentUser: authManager.getCurrentUser()
            },
            performance: this.getPerformanceInfo()
        };
    },
    
    // Get local storage information
    getLocalStorageInfo() {
        const info = {
            available: typeof Storage !== 'undefined',
            used: 0,
            keys: []
        };
        
        if (info.available) {
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    info.keys.push(key);
                    info.used += localStorage[key].length;
                }
            }
        }
        
        return info;
    },
    
    // Get performance information
    getPerformanceInfo() {
        if (!window.performance) return null;
        
        const navigation = performance.getEntriesByType('navigation')[0];
        
        return {
            loadTime: navigation ? Math.round(navigation.loadEventEnd - navigation.fetchStart) : null,
            domContentLoaded: navigation ? Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart) : null,
            memoryUsage: performance.memory ? {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            } : null
        };
    },
    
    // Export debug information
    exportDebugInfo() {
        const debugInfo = this.getDebugInfo();
        const filename = `debug-info-${new Date().toISOString().split('T')[0]}.json`;
        const data = JSON.stringify(debugInfo, null, 2);
        
        Utils.downloadFile(data, filename, 'application/json');
        this.showToast('Debug information exported', 'success');
    },
    
    // Show loading state
    showLoading(show) {
        if (window.authManager) {
            window.authManager.showLoading(show);
        }
    },
    
    // Show toast notification
    showToast(message, type = 'info') {
        if (window.toastManager) {
            window.toastManager.show(message, type);
        }
    },
    
    // Show error state
    showError(message) {
        const container = Utils.dom.get('accountInfo');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Settings</h3>
                    <p>${Utils.string.escapeHtml(message)}</p>
                    <button class="btn btn-primary" onclick="settingsManager.loadSettings()">
                        <i class="fas fa-refresh"></i>
                        Try Again
                    </button>
                </div>
            `;
        }
    }
};

// Make SettingsManager globally available
window.settingsManager = SettingsManager;