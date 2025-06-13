// Utility Functions
const Utils = {
    // DOM Utilities
    dom: {
        // Get element by ID
        get(id) {
            return document.getElementById(id);
        },
        
        // Get elements by selector
        getAll(selector) {
            return document.querySelectorAll(selector);
        },
        
        // Create element with attributes
        create(tag, attributes = {}, content = '') {
            const element = document.createElement(tag);
            
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'innerHTML') {
                    element.innerHTML = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            
            if (content) {
                element.textContent = content;
            }
            
            return element;
        },
        
        // Show element
        show(element) {
            if (typeof element === 'string') {
                element = this.get(element);
            }
            if (element) {
                element.style.display = '';
                element.classList.remove('hidden');
            }
        },
        
        // Hide element
        hide(element) {
            if (typeof element === 'string') {
                element = this.get(element);
            }
            if (element) {
                element.style.display = 'none';
                element.classList.add('hidden');
            }
        },
        
        // Toggle element visibility
        toggle(element) {
            if (typeof element === 'string') {
                element = this.get(element);
            }
            if (element) {
                if (element.style.display === 'none' || element.classList.contains('hidden')) {
                    this.show(element);
                } else {
                    this.hide(element);
                }
            }
        },
        
        // Add class
        addClass(element, className) {
            if (typeof element === 'string') {
                element = this.get(element);
            }
            if (element) {
                element.classList.add(className);
            }
        },
        
        // Remove class
        removeClass(element, className) {
            if (typeof element === 'string') {
                element = this.get(element);
            }
            if (element) {
                element.classList.remove(className);
            }
        },
        
        // Toggle class
        toggleClass(element, className) {
            if (typeof element === 'string') {
                element = this.get(element);
            }
            if (element) {
                element.classList.toggle(className);
            }
        }
    },
    
    // Local Storage Utilities
    storage: {
        // Set item
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('Storage set error:', error);
                return false;
            }
        },
        
        // Get item
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('Storage get error:', error);
                return defaultValue;
            }
        },
        
        // Remove item
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('Storage remove error:', error);
                return false;
            }
        },
        
        // Clear all
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('Storage clear error:', error);
                return false;
            }
        }
    },
    
    // Date Utilities
    date: {
        // Format date
        format(date, options = {}) {
            if (!date) return 'Never';
            
            const d = new Date(date);
            const defaultOptions = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            };
            
            return d.toLocaleDateString('en-US', { ...defaultOptions, ...options });
        },
        
        // Get relative time
        relative(date) {
            if (!date) return 'Never';
            
            const now = new Date();
            const d = new Date(date);
            const diff = now - d;
            
            const seconds = Math.floor(diff / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
            if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
            if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
            return 'Just now';
        },
        
        // Check if date is today
        isToday(date) {
            if (!date) return false;
            const today = new Date();
            const d = new Date(date);
            return d.toDateString() === today.toDateString();
        }
    },
    
    // String Utilities
    string: {
        // Truncate string
        truncate(str, length = 100, suffix = '...') {
            if (!str || str.length <= length) return str;
            return str.substring(0, length) + suffix;
        },
        
        // Capitalize first letter
        capitalize(str) {
            if (!str) return '';
            return str.charAt(0).toUpperCase() + str.slice(1);
        },
        
        // Convert to title case
        titleCase(str) {
            if (!str) return '';
            return str.replace(/\w\S*/g, (txt) => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
        },
        
        // Generate random string
        random(length = 10) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        },
        
        // Escape HTML
        escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
    },
    
    // Validation Utilities
    validate: {
        // Validate email
        email(email) {
            return CONFIG.VALIDATION.EMAIL_REGEX.test(email);
        },
        
        // Validate URL
        url(url) {
            return CONFIG.VALIDATION.URL_REGEX.test(url);
        },
        
        // Validate username
        username(username) {
            return CONFIG.VALIDATION.USERNAME_REGEX.test(username);
        },
        
        // Validate password
        password(password) {
            return password && password.length >= CONFIG.VALIDATION.MIN_PASSWORD_LENGTH;
        },
        
        // Validate required field
        required(value) {
            return value !== null && value !== undefined && value.toString().trim() !== '';
        }
    },
    
    // Array Utilities
    array: {
        // Group array by key
        groupBy(array, key) {
            return array.reduce((groups, item) => {
                const group = item[key];
                if (!groups[group]) {
                    groups[group] = [];
                }
                groups[group].push(item);
                return groups;
            }, {});
        },
        
        // Sort array by key
        sortBy(array, key, direction = 'asc') {
            return [...array].sort((a, b) => {
                const aVal = a[key];
                const bVal = b[key];
                
                if (direction === 'desc') {
                    return bVal > aVal ? 1 : -1;
                }
                return aVal > bVal ? 1 : -1;
            });
        },
        
        // Filter array by search term
        search(array, searchTerm, keys = []) {
            if (!searchTerm) return array;
            
            const term = searchTerm.toLowerCase();
            return array.filter(item => {
                if (keys.length === 0) {
                    return JSON.stringify(item).toLowerCase().includes(term);
                }
                
                return keys.some(key => {
                    const value = item[key];
                    return value && value.toString().toLowerCase().includes(term);
                });
            });
        }
    },
    
    // URL Utilities
    url: {
        // Get query parameters
        getParams() {
            const params = new URLSearchParams(window.location.search);
            const result = {};
            for (const [key, value] of params) {
                result[key] = value;
            }
            return result;
        },
        
        // Set query parameter
        setParam(key, value) {
            const url = new URL(window.location);
            url.searchParams.set(key, value);
            window.history.replaceState({}, '', url);
        },
        
        // Remove query parameter
        removeParam(key) {
            const url = new URL(window.location);
            url.searchParams.delete(key);
            window.history.replaceState({}, '', url);
        }
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Copy to clipboard failed:', error);
            return false;
        }
    },
    
    // Download data as file
    downloadFile(data, filename, type = 'application/json') {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },
    
    // Format number
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    },
    
    // Generate avatar initials
    getInitials(name) {
        if (!name) return '?';
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    },
    
    // Get platform info
    getPlatformInfo(platform) {
        return CONFIG.PLATFORMS[platform] || {
            name: Utils.string.capitalize(platform),
            icon: 'fas fa-globe',
            color: '#6b7280',
            baseUrl: '#'
        };
    },
    
    // Log function (respects debug mode)
    log(level, message, ...args) {
        if (!CONFIG.DEBUG) return;
        
        const levels = ['debug', 'info', 'warn', 'error'];
        const configLevel = levels.indexOf(CONFIG.LOG_LEVEL);
        const messageLevel = levels.indexOf(level);
        
        if (messageLevel >= configLevel) {
            console[level](`[${level.toUpperCase()}]`, message, ...args);
        }
    }
};

// Make Utils globally available
window.Utils = Utils;