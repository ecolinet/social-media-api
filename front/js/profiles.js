// Profile Manager
const ProfileManager = {
    // Current profiles data
    profiles: [],
    filteredProfiles: [],
    
    // Current editing profile
    editingProfile: null,
    
    // Initialize profile manager
    init() {
        this.setupEventListeners();
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Profile form submission
        const profileForm = Utils.dom.get('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileSubmit();
            });
        }
        
        // Close modal on outside click
        const profileModal = Utils.dom.get('profileModal');
        if (profileModal) {
            profileModal.addEventListener('click', (e) => {
                if (e.target === profileModal) {
                    this.hideProfileModal();
                }
            });
        }
        
        // Platform change handler
        const platformSelect = Utils.dom.get('profilePlatform');
        if (platformSelect) {
            platformSelect.addEventListener('change', this.handlePlatformChange.bind(this));
        }
    },
    
    // Load all profiles
    async loadProfiles() {
        if (!authManager.requireAuth()) return;
        
        try {
            this.showLoading(true);
            
            const response = await ApiService.profiles.getAll();
            
            if (response.success && response.data.success) {
                this.profiles = response.data.data.profiles || [];
                this.filteredProfiles = [...this.profiles];
                this.renderProfiles();
                this.updateStats();
            } else {
                throw new Error(response.data.message || 'Failed to load profiles');
            }
            
        } catch (error) {
            Utils.log('error', 'Load profiles error:', error);
            this.showError('Failed to load profiles: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    },
    
    // Refresh profiles
    async refreshProfiles() {
        await this.loadProfiles();
        this.showToast(CONFIG.SUCCESS_MESSAGES.DATA_REFRESHED, 'success');
    },
    
    // Filter profiles
    filterProfiles() {
        const platformFilter = Utils.dom.get('platformFilter')?.value || '';
        const statusFilter = Utils.dom.get('statusFilter')?.value || '';
        const searchFilter = Utils.dom.get('searchFilter')?.value || '';
        
        this.filteredProfiles = this.profiles.filter(profile => {
            // Platform filter
            if (platformFilter && profile.platform !== platformFilter) {
                return false;
            }
            
            // Status filter
            if (statusFilter !== '') {
                const isActive = statusFilter === 'true';
                if (profile.is_active !== isActive) {
                    return false;
                }
            }
            
            // Search filter
            if (searchFilter) {
                const searchTerm = searchFilter.toLowerCase();
                const searchableText = [
                    profile.username,
                    profile.display_name,
                    profile.bio,
                    profile.platform
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }
            
            return true;
        });
        
        this.renderProfiles();
    },
    
    // Render profiles
    renderProfiles() {
        const container = Utils.dom.get('profilesList');
        if (!container) return;
        
        if (this.filteredProfiles.length === 0) {
            this.renderEmptyState(container);
            return;
        }
        
        container.innerHTML = '';
        
        this.filteredProfiles.forEach(profile => {
            const profileCard = this.createProfileCard(profile);
            container.appendChild(profileCard);
        });
    },
    
    // Create profile card element
    createProfileCard(profile) {
        const platformInfo = Utils.getPlatformInfo(profile.platform);
        const avatarContent = profile.avatar_url 
            ? `<img src="${profile.avatar_url}" alt="${profile.display_name}" onerror="this.style.display='none'">`
            : Utils.getInitials(profile.display_name);
        
        const card = Utils.dom.create('div', {
            className: 'profile-card fade-in'
        });
        
        card.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar" style="background-color: ${platformInfo.color}">
                    ${avatarContent}
                </div>
                <div class="profile-info">
                    <h3>${Utils.string.escapeHtml(profile.display_name)}</h3>
                    <div class="profile-meta">
                        <span class="platform-badge platform-${profile.platform}">
                            <i class="${platformInfo.icon}"></i>
                            ${platformInfo.name}
                        </span>
                        <span class="status-badge status-${profile.is_active ? 'active' : 'inactive'}">
                            <i class="fas ${profile.is_active ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                            ${profile.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>
            
            <div class="profile-username">
                <i class="fas fa-at"></i>
                ${Utils.string.escapeHtml(profile.username)}
            </div>
            
            ${profile.bio ? `
                <div class="profile-bio">
                    ${Utils.string.escapeHtml(Utils.string.truncate(profile.bio, 150))}
                </div>
            ` : ''}
            
            ${profile.profile_url ? `
                <div class="profile-url">
                    <i class="fas fa-external-link-alt"></i>
                    <a href="${profile.profile_url}" target="_blank" rel="noopener noreferrer">
                        ${Utils.string.truncate(profile.profile_url, 40)}
                    </a>
                </div>
            ` : ''}
            
            ${this.renderProfileStats(profile)}
            
            <div class="profile-last-sync">
                <i class="fas fa-sync-alt"></i>
                Last synced: ${Utils.date.relative(profile.last_synced_at)}
            </div>
            
            <div class="profile-actions">
                <button class="btn btn-outline" onclick="profileManager.editProfile(${profile.id})">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
                <button class="btn btn-outline" onclick="profileManager.syncProfile(${profile.id})">
                    <i class="fas fa-sync"></i>
                    Sync
                </button>
                <button class="btn btn-error" onclick="profileManager.deleteProfile(${profile.id})">
                    <i class="fas fa-trash"></i>
                    Delete
                </button>
            </div>
        `;
        
        return card;
    },
    
    // Render profile stats
    renderProfileStats(profile) {
        if (!profile.additional_data) return '';
        
        const stats = [];
        const data = profile.additional_data;
        
        // Common stats across platforms
        if (data.followers_count !== undefined) {
            stats.push({
                label: 'Followers',
                value: Utils.formatNumber(data.followers_count)
            });
        }
        
        if (data.following_count !== undefined) {
            stats.push({
                label: 'Following',
                value: Utils.formatNumber(data.following_count)
            });
        }
        
        // Platform-specific stats
        if (profile.platform === 'twitter' && data.tweets_count !== undefined) {
            stats.push({
                label: 'Tweets',
                value: Utils.formatNumber(data.tweets_count)
            });
        }
        
        if (profile.platform === 'youtube' && data.subscribers_count !== undefined) {
            stats.push({
                label: 'Subscribers',
                value: Utils.formatNumber(data.subscribers_count)
            });
        }
        
        if (stats.length === 0) return '';
        
        return `
            <div class="profile-stats">
                ${stats.map(stat => `
                    <div class="profile-stat">
                        <span class="profile-stat-value">${stat.value}</span>
                        <span class="profile-stat-label">${stat.label}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    // Render empty state
    renderEmptyState(container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No profiles found</h3>
                <p>You haven't added any social media profiles yet, or no profiles match your current filters.</p>
                ${authManager.isAuthenticated ? `
                    <button class="btn btn-primary" onclick="profileManager.showAddModal()">
                        <i class="fas fa-plus"></i>
                        Add Your First Profile
                    </button>
                ` : `
                    <button class="btn btn-primary" onclick="authManager.showLoginModal()">
                        <i class="fas fa-sign-in-alt"></i>
                        Login to Add Profiles
                    </button>
                `}
            </div>
        `;
    },
    
    // Show add profile modal
    showAddModal() {
        if (!authManager.requireAuth()) return;
        
        this.editingProfile = null;
        this.resetProfileForm();
        
        const modalTitle = Utils.dom.get('profileModalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Add New Profile';
        }
        
        this.showProfileModal();
    },
    
    // Show edit profile modal
    editProfile(profileId) {
        if (!authManager.requireAuth()) return;
        
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) {
            this.showToast('Profile not found', 'error');
            return;
        }
        
        this.editingProfile = profile;
        this.populateProfileForm(profile);
        
        const modalTitle = Utils.dom.get('profileModalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Profile';
        }
        
        this.showProfileModal();
    },
    
    // Show profile modal
    showProfileModal() {
        const modal = Utils.dom.get('profileModal');
        if (modal) {
            Utils.dom.addClass(modal, 'show');
        }
    },
    
    // Hide profile modal
    hideProfileModal() {
        const modal = Utils.dom.get('profileModal');
        if (modal) {
            Utils.dom.removeClass(modal, 'show');
        }
        this.editingProfile = null;
    },
    
    // Reset profile form
    resetProfileForm() {
        const form = Utils.dom.get('profileForm');
        if (form) {
            form.reset();
        }
    },
    
    // Populate profile form with data
    populateProfileForm(profile) {
        const fields = [
            'profilePlatform',
            'profileUsername', 
            'profileDisplayName',
            'profileUrl',
            'profileAvatarUrl',
            'profileBio'
        ];
        
        const mapping = {
            profilePlatform: 'platform',
            profileUsername: 'username',
            profileDisplayName: 'display_name',
            profileUrl: 'profile_url',
            profileAvatarUrl: 'avatar_url',
            profileBio: 'bio'
        };
        
        fields.forEach(fieldId => {
            const field = Utils.dom.get(fieldId);
            const dataKey = mapping[fieldId];
            if (field && profile[dataKey] !== undefined) {
                field.value = profile[dataKey] || '';
            }
        });
        
        const activeField = Utils.dom.get('profileActive');
        if (activeField) {
            activeField.checked = profile.is_active;
        }
    },
    
    // Handle platform change
    handlePlatformChange() {
        const platform = Utils.dom.get('profilePlatform')?.value;
        const urlField = Utils.dom.get('profileUrl');
        const usernameField = Utils.dom.get('profileUsername');
        
        if (platform && urlField && usernameField) {
            const platformInfo = Utils.getPlatformInfo(platform);
            const username = usernameField.value;
            
            if (username && !urlField.value) {
                urlField.value = platformInfo.baseUrl + username;
            }
        }
    },
    
    // Handle profile form submission
    async handleProfileSubmit() {
        const formData = this.getProfileFormData();
        
        // Validate form data
        const validation = this.validateProfileData(formData);
        if (!validation.valid) {
            this.showToast(validation.message, 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            
            let response;
            if (this.editingProfile) {
                response = await ApiService.profiles.update(this.editingProfile.id, formData);
            } else {
                response = await ApiService.profiles.create(formData);
            }
            
            if (response.success && response.data.success) {
                const message = this.editingProfile 
                    ? CONFIG.SUCCESS_MESSAGES.PROFILE_UPDATED
                    : CONFIG.SUCCESS_MESSAGES.PROFILE_CREATED;
                
                this.showToast(message, 'success');
                this.hideProfileModal();
                await this.loadProfiles();
                
            } else {
                throw new Error(response.data.message || 'Failed to save profile');
            }
            
        } catch (error) {
            Utils.log('error', 'Profile save error:', error);
            
            if (error.status === 422 && error.errors) {
                // Show validation errors
                const errorMessages = Object.values(error.errors).flat();
                this.showToast(errorMessages.join(', '), 'error');
            } else {
                this.showToast(error.message || 'Failed to save profile', 'error');
            }
        } finally {
            this.showLoading(false);
        }
    },
    
    // Get profile form data
    getProfileFormData() {
        return {
            platform: Utils.dom.get('profilePlatform')?.value || '',
            username: Utils.dom.get('profileUsername')?.value?.trim() || '',
            display_name: Utils.dom.get('profileDisplayName')?.value?.trim() || '',
            profile_url: Utils.dom.get('profileUrl')?.value?.trim() || '',
            avatar_url: Utils.dom.get('profileAvatarUrl')?.value?.trim() || '',
            bio: Utils.dom.get('profileBio')?.value?.trim() || '',
            is_active: Utils.dom.get('profileActive')?.checked || false,
            platform_user_id: `${Utils.dom.get('profilePlatform')?.value}_${Utils.dom.get('profileUsername')?.value}_${Date.now()}`,
            additional_data: {
                created_via: 'frontend_interface',
                timestamp: new Date().toISOString()
            }
        };
    },
    
    // Validate profile data
    validateProfileData(data) {
        if (!data.platform) {
            return { valid: false, message: 'Please select a platform' };
        }
        
        if (!data.username) {
            return { valid: false, message: 'Username is required' };
        }
        
        if (!Utils.validate.username(data.username)) {
            return { valid: false, message: 'Username contains invalid characters' };
        }
        
        if (!data.display_name) {
            return { valid: false, message: 'Display name is required' };
        }
        
        if (data.display_name.length > CONFIG.VALIDATION.MAX_DISPLAY_NAME_LENGTH) {
            return { valid: false, message: `Display name must be less than ${CONFIG.VALIDATION.MAX_DISPLAY_NAME_LENGTH} characters` };
        }
        
        if (data.profile_url && !Utils.validate.url(data.profile_url)) {
            return { valid: false, message: 'Please enter a valid profile URL' };
        }
        
        if (data.avatar_url && !Utils.validate.url(data.avatar_url)) {
            return { valid: false, message: 'Please enter a valid avatar URL' };
        }
        
        if (data.bio && data.bio.length > CONFIG.VALIDATION.MAX_BIO_LENGTH) {
            return { valid: false, message: `Bio must be less than ${CONFIG.VALIDATION.MAX_BIO_LENGTH} characters` };
        }
        
        return { valid: true };
    },
    
    // Delete profile
    async deleteProfile(profileId) {
        if (!authManager.requireAuth()) return;
        
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) {
            this.showToast('Profile not found', 'error');
            return;
        }
        
        if (!confirm(`Are you sure you want to delete the profile "${profile.display_name}"? This action cannot be undone.`)) {
            return;
        }
        
        try {
            this.showLoading(true);
            
            const response = await ApiService.profiles.delete(profileId);
            
            if (response.success && response.data.success) {
                this.showToast(CONFIG.SUCCESS_MESSAGES.PROFILE_DELETED, 'success');
                await this.loadProfiles();
            } else {
                throw new Error(response.data.message || 'Failed to delete profile');
            }
            
        } catch (error) {
            Utils.log('error', 'Profile delete error:', error);
            this.showToast(error.message || 'Failed to delete profile', 'error');
        } finally {
            this.showLoading(false);
        }
    },
    
    // Sync profile
    async syncProfile(profileId) {
        if (!authManager.requireAuth()) return;
        
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) {
            this.showToast('Profile not found', 'error');
            return;
        }
        
        try {
            this.showLoading(true);
            
            const response = await ApiService.profiles.sync(profileId);
            
            if (response.success && response.data.success) {
                this.showToast(CONFIG.SUCCESS_MESSAGES.PROFILE_SYNCED, 'success');
                await this.loadProfiles();
            } else {
                throw new Error(response.data.message || 'Failed to sync profile');
            }
            
        } catch (error) {
            Utils.log('error', 'Profile sync error:', error);
            this.showToast(error.message || 'Failed to sync profile', 'error');
        } finally {
            this.showLoading(false);
        }
    },
    
    // Sync all profiles
    async syncAllProfiles() {
        if (!authManager.requireAuth()) return;
        
        if (this.profiles.length === 0) {
            this.showToast('No profiles to sync', 'warning');
            return;
        }
        
        try {
            this.showLoading(true);
            
            const response = await ApiService.profiles.syncAll();
            
            if (response.success) {
                const { total, successful, failed } = response.data;
                const message = `Sync completed: ${successful}/${total} profiles synced successfully`;
                
                if (failed > 0) {
                    this.showToast(`${message}. ${failed} profiles failed to sync.`, 'warning');
                } else {
                    this.showToast(message, 'success');
                }
                
                await this.loadProfiles();
            } else {
                throw new Error('Failed to sync profiles');
            }
            
        } catch (error) {
            Utils.log('error', 'Bulk sync error:', error);
            this.showToast(error.message || 'Failed to sync profiles', 'error');
        } finally {
            this.showLoading(false);
        }
    },
    
    // Update stats
    updateStats() {
        const totalElement = Utils.dom.get('totalProfiles');
        const activeElement = Utils.dom.get('activeProfiles');
        const platformElement = Utils.dom.get('platformCount');
        const lastSyncElement = Utils.dom.get('lastSync');
        
        if (totalElement) {
            totalElement.textContent = this.profiles.length;
        }
        
        if (activeElement) {
            const activeCount = this.profiles.filter(p => p.is_active).length;
            activeElement.textContent = activeCount;
        }
        
        if (platformElement) {
            const platforms = new Set(this.profiles.map(p => p.platform));
            platformElement.textContent = platforms.size;
        }
        
        if (lastSyncElement) {
            const lastSync = this.profiles.reduce((latest, profile) => {
                const syncDate = new Date(profile.last_synced_at);
                return syncDate > latest ? syncDate : latest;
            }, new Date(0));
            
            lastSyncElement.textContent = lastSync.getTime() > 0 
                ? Utils.date.relative(lastSync)
                : 'Never';
        }
    },
    
    // Load recent profiles for dashboard
    async loadRecentProfiles() {
        if (!authManager.isAuthenticated) return;
        
        try {
            const response = await ApiService.profiles.getAll();
            
            if (response.success && response.data.success) {
                const profiles = response.data.data.profiles || [];
                const recentProfiles = profiles
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                    .slice(0, 6);
                
                this.renderRecentProfiles(recentProfiles);
            }
            
        } catch (error) {
            Utils.log('error', 'Load recent profiles error:', error);
        }
    },
    
    // Render recent profiles for dashboard
    renderRecentProfiles(profiles) {
        const container = Utils.dom.get('recentProfilesList');
        if (!container) return;
        
        if (profiles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No profiles yet</h3>
                    <p>Add your first social media profile to get started.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        profiles.forEach(profile => {
            const profileCard = this.createProfileCard(profile);
            container.appendChild(profileCard);
        });
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
        const container = Utils.dom.get('profilesList');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Profiles</h3>
                    <p>${Utils.string.escapeHtml(message)}</p>
                    <button class="btn btn-primary" onclick="profileManager.loadProfiles()">
                        <i class="fas fa-refresh"></i>
                        Try Again
                    </button>
                </div>
            `;
        }
    }
};

// Make ProfileManager globally available
window.profileManager = ProfileManager;