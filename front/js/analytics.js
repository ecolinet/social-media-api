// Analytics Manager
const AnalyticsManager = {
    // Analytics data
    data: {
        profiles: [],
        platformStats: {},
        totalStats: {}
    },
    
    // Initialize analytics
    init() {
        // Analytics will be loaded when the page is shown
    },
    
    // Load analytics data
    async loadAnalytics() {
        if (!authManager.requireAuth()) return;
        
        try {
            this.showLoading(true);
            
            // Load profiles data
            const profilesResponse = await ApiService.profiles.getAll();
            
            if (profilesResponse.success && profilesResponse.data.success) {
                this.data.profiles = profilesResponse.data.data.profiles || [];
                this.processAnalyticsData();
                this.renderAnalytics();
            } else {
                throw new Error(profilesResponse.data.message || 'Failed to load analytics data');
            }
            
        } catch (error) {
            Utils.log('error', 'Load analytics error:', error);
            this.showError('Failed to load analytics: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    },
    
    // Process raw data into analytics
    processAnalyticsData() {
        const profiles = this.data.profiles;
        
        // Platform statistics
        this.data.platformStats = Utils.array.groupBy(profiles, 'platform');
        
        // Calculate platform counts and percentages
        Object.keys(this.data.platformStats).forEach(platform => {
            const platformProfiles = this.data.platformStats[platform];
            this.data.platformStats[platform] = {
                profiles: platformProfiles,
                count: platformProfiles.length,
                activeCount: platformProfiles.filter(p => p.is_active).length,
                percentage: Math.round((platformProfiles.length / profiles.length) * 100)
            };
        });
        
        // Total statistics
        this.data.totalStats = {
            totalProfiles: profiles.length,
            activeProfiles: profiles.filter(p => p.is_active).length,
            inactiveProfiles: profiles.filter(p => !p.is_active).length,
            totalPlatforms: Object.keys(this.data.platformStats).length,
            averageProfilesPerPlatform: profiles.length > 0 
                ? Math.round(profiles.length / Object.keys(this.data.platformStats).length * 10) / 10 
                : 0
        };
        
        // Recent activity
        this.data.recentActivity = this.calculateRecentActivity(profiles);
    },
    
    // Calculate recent activity metrics
    calculateRecentActivity(profiles) {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        return {
            syncedToday: profiles.filter(p => 
                p.last_synced_at && new Date(p.last_synced_at) > oneDayAgo
            ).length,
            syncedThisWeek: profiles.filter(p => 
                p.last_synced_at && new Date(p.last_synced_at) > oneWeekAgo
            ).length,
            syncedThisMonth: profiles.filter(p => 
                p.last_synced_at && new Date(p.last_synced_at) > oneMonthAgo
            ).length,
            createdThisWeek: profiles.filter(p => 
                new Date(p.created_at) > oneWeekAgo
            ).length,
            createdThisMonth: profiles.filter(p => 
                new Date(p.created_at) > oneMonthAgo
            ).length
        };
    },
    
    // Render analytics
    renderAnalytics() {
        this.renderPlatformChart();
        this.renderPlatformStats();
    },
    
    // Render platform distribution chart
    renderPlatformChart() {
        const container = Utils.dom.get('platformChart');
        if (!container) return;
        
        const platformStats = this.data.platformStats;
        const platforms = Object.keys(platformStats);
        
        if (platforms.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-bar"></i>
                    <h3>No data to display</h3>
                    <p>Add some social media profiles to see analytics.</p>
                </div>
            `;
            return;
        }
        
        // Create simple bar chart
        const maxCount = Math.max(...platforms.map(p => platformStats[p].count));
        
        container.innerHTML = `
            <div class="chart-bar">
                ${platforms.map(platform => {
                    const stats = platformStats[platform];
                    const platformInfo = Utils.getPlatformInfo(platform);
                    const height = maxCount > 0 ? (stats.count / maxCount) * 100 : 0;
                    
                    return `
                        <div class="chart-bar-item">
                            <div class="chart-bar-value" 
                                 style="height: ${height}%; background-color: ${platformInfo.color}">
                                <div class="chart-bar-count">${stats.count}</div>
                            </div>
                            <div class="chart-bar-label">
                                <i class="${platformInfo.icon}"></i>
                                ${platformInfo.name}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            <div class="chart-summary">
                <p>Total profiles across ${platforms.length} platform${platforms.length !== 1 ? 's' : ''}</p>
            </div>
        `;
    },
    
    // Render platform statistics
    renderPlatformStats() {
        const container = Utils.dom.get('platformStats');
        if (!container) return;
        
        const platformStats = this.data.platformStats;
        const platforms = Object.keys(platformStats).sort((a, b) => 
            platformStats[b].count - platformStats[a].count
        );
        
        if (platforms.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-pie"></i>
                    <h3>No platform data</h3>
                    <p>Add profiles to see platform statistics.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = platforms.map(platform => {
            const stats = platformStats[platform];
            const platformInfo = Utils.getPlatformInfo(platform);
            
            return `
                <div class="platform-stat-item">
                    <div class="platform-stat-info">
                        <div class="platform-stat-icon" style="background-color: ${platformInfo.color}">
                            <i class="${platformInfo.icon}"></i>
                        </div>
                        <div>
                            <div class="platform-stat-name">${platformInfo.name}</div>
                            <div class="platform-stat-details">
                                ${stats.activeCount}/${stats.count} active
                                ${stats.percentage > 0 ? `(${stats.percentage}%)` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="platform-stat-count">${stats.count}</div>
                </div>
            `;
        }).join('');
        
        // Add summary statistics
        const summaryHtml = `
            <div class="analytics-summary">
                <h3>Summary</h3>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <span class="summary-stat-label">Total Profiles:</span>
                        <span class="summary-stat-value">${this.data.totalStats.totalProfiles}</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Active Profiles:</span>
                        <span class="summary-stat-value">${this.data.totalStats.activeProfiles}</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Platforms:</span>
                        <span class="summary-stat-value">${this.data.totalStats.totalPlatforms}</span>
                    </div>
                    <div class="summary-stat">
                        <span class="summary-stat-label">Avg per Platform:</span>
                        <span class="summary-stat-value">${this.data.totalStats.averageProfilesPerPlatform}</span>
                    </div>
                </div>
                
                ${this.renderRecentActivity()}
            </div>
        `;
        
        container.innerHTML += summaryHtml;
    },
    
    // Render recent activity section
    renderRecentActivity() {
        const activity = this.data.recentActivity;
        
        return `
            <div class="recent-activity">
                <h4>Recent Activity</h4>
                <div class="activity-stats">
                    <div class="activity-stat">
                        <i class="fas fa-sync text-primary"></i>
                        <span>Synced today: <strong>${activity.syncedToday}</strong></span>
                    </div>
                    <div class="activity-stat">
                        <i class="fas fa-calendar-week text-success"></i>
                        <span>Synced this week: <strong>${activity.syncedThisWeek}</strong></span>
                    </div>
                    <div class="activity-stat">
                        <i class="fas fa-plus text-info"></i>
                        <span>Created this week: <strong>${activity.createdThisWeek}</strong></span>
                    </div>
                    <div class="activity-stat">
                        <i class="fas fa-calendar-alt text-warning"></i>
                        <span>Created this month: <strong>${activity.createdThisMonth}</strong></span>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Export analytics data
    exportData(format = 'json') {
        if (!authManager.requireAuth()) return;
        
        const exportData = {
            generated_at: new Date().toISOString(),
            user: authManager.getCurrentUser(),
            summary: this.data.totalStats,
            platform_statistics: this.data.platformStats,
            recent_activity: this.data.recentActivity,
            profiles: this.data.profiles.map(profile => ({
                id: profile.id,
                platform: profile.platform,
                username: profile.username,
                display_name: profile.display_name,
                is_active: profile.is_active,
                created_at: profile.created_at,
                updated_at: profile.updated_at,
                last_synced_at: profile.last_synced_at
            }))
        };
        
        let filename, data, mimeType;
        
        if (format === 'csv') {
            filename = `social-media-analytics-${new Date().toISOString().split('T')[0]}.csv`;
            data = this.convertToCSV(exportData.profiles);
            mimeType = 'text/csv';
        } else {
            filename = `social-media-analytics-${new Date().toISOString().split('T')[0]}.json`;
            data = JSON.stringify(exportData, null, 2);
            mimeType = 'application/json';
        }
        
        Utils.downloadFile(data, filename, mimeType);
        this.showToast(`Analytics data exported as ${format.toUpperCase()}`, 'success');
    },
    
    // Convert profiles data to CSV
    convertToCSV(profiles) {
        if (profiles.length === 0) return '';
        
        const headers = [
            'ID', 'Platform', 'Username', 'Display Name', 
            'Active', 'Created At', 'Updated At', 'Last Synced At'
        ];
        
        const rows = profiles.map(profile => [
            profile.id,
            profile.platform,
            profile.username,
            profile.display_name,
            profile.is_active ? 'Yes' : 'No',
            profile.created_at,
            profile.updated_at,
            profile.last_synced_at || 'Never'
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(field => 
                typeof field === 'string' && field.includes(',') 
                    ? `"${field.replace(/"/g, '""')}"` 
                    : field
            ).join(','))
        ].join('\n');
        
        return csvContent;
    },
    
    // Refresh analytics data
    async refreshAnalytics() {
        await this.loadAnalytics();
        this.showToast('Analytics data refreshed', 'success');
    },
    
    // Get insights and recommendations
    getInsights() {
        const insights = [];
        const stats = this.data.totalStats;
        const platformStats = this.data.platformStats;
        const activity = this.data.recentActivity;
        
        // Profile count insights
        if (stats.totalProfiles === 0) {
            insights.push({
                type: 'info',
                title: 'Get Started',
                message: 'Add your first social media profile to start tracking your online presence.'
            });
        } else if (stats.totalProfiles < 3) {
            insights.push({
                type: 'suggestion',
                title: 'Expand Your Presence',
                message: 'Consider adding more social media profiles to maximize your online reach.'
            });
        }
        
        // Active profile insights
        if (stats.inactiveProfiles > stats.activeProfiles) {
            insights.push({
                type: 'warning',
                title: 'Inactive Profiles',
                message: `You have ${stats.inactiveProfiles} inactive profiles. Consider activating them or removing unused ones.`
            });
        }
        
        // Platform diversity insights
        if (stats.totalPlatforms === 1 && stats.totalProfiles > 1) {
            insights.push({
                type: 'suggestion',
                title: 'Platform Diversity',
                message: 'All your profiles are on the same platform. Consider diversifying across different social media platforms.'
            });
        }
        
        // Sync activity insights
        if (activity.syncedToday === 0 && stats.totalProfiles > 0) {
            insights.push({
                type: 'reminder',
                title: 'Sync Reminder',
                message: 'No profiles have been synced today. Regular syncing helps keep your data up to date.'
            });
        }
        
        // Platform-specific insights
        const topPlatform = Object.keys(platformStats).reduce((a, b) => 
            platformStats[a].count > platformStats[b].count ? a : b, 
            Object.keys(platformStats)[0]
        );
        
        if (topPlatform && platformStats[topPlatform].count > stats.totalProfiles * 0.6) {
            const platformInfo = Utils.getPlatformInfo(topPlatform);
            insights.push({
                type: 'info',
                title: 'Platform Focus',
                message: `${platformInfo.name} represents ${platformStats[topPlatform].percentage}% of your profiles. This shows a strong focus on this platform.`
            });
        }
        
        return insights;
    },
    
    // Render insights
    renderInsights() {
        const insights = this.getInsights();
        
        if (insights.length === 0) return '';
        
        return `
            <div class="analytics-insights">
                <h4>Insights & Recommendations</h4>
                <div class="insights-list">
                    ${insights.map(insight => `
                        <div class="insight-item insight-${insight.type}">
                            <div class="insight-icon">
                                <i class="fas ${this.getInsightIcon(insight.type)}"></i>
                            </div>
                            <div class="insight-content">
                                <h5>${insight.title}</h5>
                                <p>${insight.message}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    // Get icon for insight type
    getInsightIcon(type) {
        const icons = {
            info: 'fa-info-circle',
            suggestion: 'fa-lightbulb',
            warning: 'fa-exclamation-triangle',
            reminder: 'fa-bell'
        };
        return icons[type] || icons.info;
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
        const chartContainer = Utils.dom.get('platformChart');
        const statsContainer = Utils.dom.get('platformStats');
        
        const errorHtml = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Analytics</h3>
                <p>${Utils.string.escapeHtml(message)}</p>
                <button class="btn btn-primary" onclick="analyticsManager.loadAnalytics()">
                    <i class="fas fa-refresh"></i>
                    Try Again
                </button>
            </div>
        `;
        
        if (chartContainer) chartContainer.innerHTML = errorHtml;
        if (statsContainer) statsContainer.innerHTML = '';
    }
};

// Make AnalyticsManager globally available
window.analyticsManager = AnalyticsManager;