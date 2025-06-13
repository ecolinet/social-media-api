// API Service
const ApiService = {
    // Base configuration
    baseURL: CONFIG.API_BASE_URL,
    
    // Get access token
    getToken() {
        return Utils.storage.get(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    },
    
    // Set access token
    setToken(token) {
        Utils.storage.set(CONFIG.STORAGE_KEYS.ACCESS_TOKEN, token);
    },
    
    // Remove access token
    removeToken() {
        Utils.storage.remove(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    },
    
    // Make HTTP request
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const token = this.getToken();
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        // Add authorization header if token exists
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        try {
            Utils.log('debug', `API Request: ${options.method || 'GET'} ${url}`, config);
            
            const response = await fetch(url, config);
            const data = await response.json();
            
            Utils.log('debug', `API Response: ${response.status}`, data);
            
            // Handle different response statuses
            if (response.status === 401) {
                // Unauthorized - remove token and redirect to login
                this.removeToken();
                if (window.authManager) {
                    window.authManager.handleUnauthorized();
                }
                throw new Error(CONFIG.ERROR_MESSAGES.UNAUTHORIZED);
            }
            
            if (response.status === 403) {
                throw new Error(CONFIG.ERROR_MESSAGES.FORBIDDEN);
            }
            
            if (response.status === 404) {
                throw new Error(CONFIG.ERROR_MESSAGES.NOT_FOUND);
            }
            
            if (response.status === 422) {
                // Validation error
                const message = data.message || CONFIG.ERROR_MESSAGES.VALIDATION_ERROR;
                const error = new Error(message);
                error.errors = data.errors;
                error.status = 422;
                throw error;
            }
            
            if (response.status >= 500) {
                throw new Error(CONFIG.ERROR_MESSAGES.SERVER_ERROR);
            }
            
            if (!response.ok) {
                throw new Error(data.message || CONFIG.ERROR_MESSAGES.UNKNOWN_ERROR);
            }
            
            return {
                success: true,
                data: data,
                status: response.status
            };
            
        } catch (error) {
            Utils.log('error', 'API Error:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error(CONFIG.ERROR_MESSAGES.NETWORK_ERROR);
            }
            
            throw error;
        }
    },
    
    // GET request
    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}${endpoint}`);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, value);
            }
        });
        
        return this.request(url.pathname + url.search, {
            method: 'GET'
        });
    },
    
    // POST request
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    // PUT request
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    },
    
    // Authentication endpoints
    auth: {
        // Login
        async login(credentials) {
            return ApiService.post('/login', credentials);
        },
        
        // Register
        async register(userData) {
            return ApiService.post('/register', userData);
        },
        
        // Get current user
        async getUser() {
            return ApiService.get('/user');
        },
        
        // Logout
        async logout() {
            return ApiService.post('/logout');
        }
    },
    
    // Profile endpoints
    profiles: {
        // Get all profiles
        async getAll(filters = {}) {
            return ApiService.get('/social-media-profiles', filters);
        },
        
        // Get profile by ID
        async getById(id) {
            return ApiService.get(`/social-media-profiles/${id}`);
        },
        
        // Create profile
        async create(profileData) {
            return ApiService.post('/social-media-profiles', profileData);
        },
        
        // Update profile
        async update(id, profileData) {
            return ApiService.put(`/social-media-profiles/${id}`, profileData);
        },
        
        // Delete profile
        async delete(id) {
            return ApiService.delete(`/social-media-profiles/${id}`);
        },
        
        // Get profiles grouped by platform
        async getByPlatform() {
            return ApiService.get('/social-media-profiles-by-platform');
        },
        
        // Sync profile
        async sync(id) {
            return ApiService.post(`/social-media-profiles/${id}/sync`);
        },
        
        // Bulk sync all profiles
        async syncAll() {
            const response = await this.getAll();
            if (response.success && response.data.data.profiles) {
                const syncPromises = response.data.data.profiles.map(profile => 
                    this.sync(profile.id).catch(error => {
                        Utils.log('warn', `Failed to sync profile ${profile.id}:`, error);
                        return { success: false, error };
                    })
                );
                
                const results = await Promise.all(syncPromises);
                const successful = results.filter(r => r.success).length;
                const failed = results.length - successful;
                
                return {
                    success: true,
                    data: {
                        total: results.length,
                        successful,
                        failed,
                        results
                    }
                };
            }
            
            throw new Error('Failed to get profiles for sync');
        }
    },
    
    // Utility endpoints
    utils: {
        // Health check
        async health() {
            return ApiService.get('/health');
        },
        
        // Get OpenAPI spec
        async getOpenApiSpec(format = 'json') {
            const endpoint = format === 'yaml' ? '/openapi.yaml' : '/openapi.json';
            return ApiService.get(endpoint);
        }
    }
};

// Make ApiService globally available
window.ApiService = ApiService;