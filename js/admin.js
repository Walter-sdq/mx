// Enhanced 3D Admin Dashboard
const admin = {
    currentUser: null,
    currentPage: 'dashboard',
    users: [],
    filteredUsers: [],
    currentPageNum: 1,
    itemsPerPage: 10,
    isLoading: false,
    animations: {
        fadeIn: 'fadeIn 0.6s ease-out forwards',
        slideUp: 'slideUp 0.8s ease-out forwards',
        scaleIn: 'scaleIn 0.5s ease-out forwards',
        bounceIn: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards'
    },

    // Initialize admin dashboard with enhanced 3D effects
    async init() {
        this.addLoadingAnimation();
        this.setup3DEffects();

        try {
            // Check authentication and role
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                this.redirectToLogin();
                return;
            }

            this.currentUser = user;
            await this.validateAdminAccess(user.id);

            this.setupEventListeners();
            await this.loadDashboardData();
            this.showPage('dashboard');
            this.removeLoadingAnimation();

            // Add welcome animation
            this.showWelcomeAnimation();
        } catch (error) {
            console.error('Initialization error:', error);
            this.handleInitError(error);
        }
    },

    // Add loading animation
    addLoadingAnimation() {
        const loadingHTML = `
            <div id="admin-loading" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex; align-items: center; justify-content: center;
                z-index: 9999; opacity: 1; transition: opacity 0.5s ease;
            ">
                <div style="text-align: center; color: white;">
                    <div style="
                        width: 80px; height: 80px; border: 4px solid rgba(255,255,255,0.3);
                        border-top: 4px solid white; border-radius: 50%;
                        animation: spin 1s linear infinite; margin: 0 auto 20px;
                    "></div>
                    <h2 style="margin: 0; font-size: 1.5rem;">Loading Admin Panel</h2>
                    <p style="margin: 10px 0 0 0; opacity: 0.8;">Initializing 3D interface...</p>
                </div>
            </div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes bounceIn { 0% { opacity: 0; transform: scale(0.3); } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
            </style>
        `;
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    },

    // Remove loading animation
    removeLoadingAnimation() {
        const loading = document.getElementById('admin-loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.remove(), 500);
        }
    },

    // Setup 3D effects
    setup3DEffects() {
        // Add CSS for 3D effects
        const style = document.createElement('style');
        style.textContent = `
            .stat-card {
                transform-style: preserve-3d;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .stat-card:hover {
                transform: translateY(-5px) rotateX(5deg);
                box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            }
            .menu-item {
                transform-style: preserve-3d;
                transition: transform 0.3s ease;
            }
            .menu-item:hover {
                transform: translateY(-2px) translateZ(10px);
            }
            .btn {
                transform-style: preserve-3d;
                transition: transform 0.2s ease;
            }
            .btn:hover {
                transform: translateY(-2px) translateZ(5px);
            }
            .activity-item {
                transition: transform 0.2s ease;
            }
            .activity-item:hover {
                transform: translateX(10px);
            }
        `;
        document.head.appendChild(style);
    },

    // Validate admin access
    async validateAdminAccess(userId) {
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', userId)
            .single();

        if (profileError || !profile || !['admin', 'super_admin'].includes(profile.role)) {
            throw new Error('Admin access denied');
        }

        // Update header with admin name
        const header = document.querySelector('.admin-header h1');
        if (header && profile.full_name) {
            header.innerHTML = `<i class="fas fa-crown"></i> Welcome back, ${profile.full_name}`;
        }
    },

    // Redirect to login
    redirectToLogin() {
        showToast('Please log in to access the admin panel', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    },

    // Handle initialization error
    handleInitError(error) {
        this.removeLoadingAnimation();
        showToast(`Initialization failed: ${error.message}`, 'error');

        // Show error screen
        const errorHTML = `
            <div style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex; align-items: center; justify-content: center;
                z-index: 9999; color: white; text-align: center;
            ">
                <div>
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; margin-bottom: 20px;"></i>
                    <h1>Access Denied</h1>
                    <p>Admin privileges required to access this panel.</p>
                    <button onclick="window.location.href='dashboard.html'" style="
                        background: white; color: #667eea; border: none; padding: 12px 24px;
                        border-radius: 8px; margin-top: 20px; cursor: pointer;
                    ">Return to Dashboard</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', errorHTML);
    },

    // Show welcome animation
    showWelcomeAnimation() {
        const sidebar = document.querySelector('.admin-sidebar');
        const main = document.querySelector('.admin-main');

        if (sidebar) {
            sidebar.style.animation = this.animations.slideUp;
        }
        if (main) {
            main.style.animation = this.animations.fadeIn;
        }

        // Animate stats cards
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            card.style.animation = `${this.animations.bounceIn} ${0.6 + index * 0.1}s`;
        });
    },

    // Setup event listeners
    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.showPage(page);
            });
        });

        // Search and filter
        const searchInput = document.getElementById('user-search');
        const filterSelect = document.getElementById('user-filter');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterUsers());
        }
        if (filterSelect) {
            filterSelect.addEventListener('change', () => this.filterUsers());
        }

        // Broadcast form
        const broadcastForm = document.getElementById('broadcast-form');
        if (broadcastForm) {
            broadcastForm.addEventListener('submit', (e) => this.sendBroadcast(e));
        }

        // Broadcast recipients change
        const broadcastRecipients = document.getElementById('broadcast-recipients');
        const userSelector = document.getElementById('user-selector');
        if (broadcastRecipients && userSelector) {
            broadcastRecipients.addEventListener('change', () => {
                userSelector.style.display = broadcastRecipients.value === 'select' ? 'block' : 'none';
                if (broadcastRecipients.value === 'select') {
                    this.loadUserCheckboxes();
                }
            });
        }

        // Edit user form
        const editUserForm = document.getElementById('edit-user-form');
        if (editUserForm) {
            editUserForm.addEventListener('submit', (e) => this.saveUserChanges(e));
        }
    },

    // Show page
    showPage(pageName) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));

        const targetPage = document.getElementById(`${pageName}-page`);
        const targetMenu = document.querySelector(`.menu-item[data-page="${pageName}"]`);

        if (targetPage) targetPage.classList.add('active');
        if (targetMenu) targetMenu.classList.add('active');

        this.currentPage = pageName;

        // Load page-specific data
        switch (pageName) {
            case 'users':
                this.loadUsers();
                break;
            case 'transactions':
                this.loadTransactions();
                break;
            case 'withdrawals':
                this.loadWithdrawals();
                break;
            case 'trades':
                this.loadTrades();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
    },

    // Load dashboard data
    async loadDashboardData() {
        try {
            // Load stats
            const [usersResult, depositsResult, withdrawalsResult] = await Promise.all([
                supabase.from('profiles').select('id, created_at'),
                supabase.from('transactions').select('amount').eq('type', 'deposit'),
                supabase.from('withdrawals').select('id').eq('status', 'pending')
            ]);

            if (usersResult.data) {
                document.getElementById('total-users').textContent = usersResult.data.length;
                const activeUsers = usersResult.data.filter(u => {
                    const lastLogin = new Date(u.last_login || u.created_at);
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    return lastLogin > weekAgo;
                }).length;
                document.getElementById('active-users').textContent = activeUsers;
            }

            if (depositsResult.data) {
                const totalDeposits = depositsResult.data.reduce((sum, t) => sum + (t.amount || 0), 0);
                document.getElementById('total-deposits').textContent = `$${totalDeposits.toFixed(2)}`;
            }

            if (withdrawalsResult.data) {
                document.getElementById('pending-withdrawals').textContent = withdrawalsResult.data.length;
            }

            // Load recent activity
            this.loadRecentActivity();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showToast('Error loading dashboard data', 'error');
        }
    },

    // Load recent activity
    async loadRecentActivity() {
        try {
            const { data: logs, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;

            const activityList = document.getElementById('admin-activity-list');
            if (!activityList) return;

            activityList.innerHTML = logs.map(log => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-${this.getActivityIcon(log.action)}"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">${log.action}</div>
                        <div class="activity-details">${log.details}</div>
                        <div class="activity-time">${this.formatTimeAgo(log.created_at)}</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading activity:', error);
        }
    },

    // Load users
    async loadUsers() {
        try {
            const { data: users, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.users = users;
            this.filterUsers();
        } catch (error) {
            console.error('Error loading users:', error);
            showToast('Error loading users', 'error');
        }
    },

    // Filter users
    filterUsers() {
        const searchTerm = document.getElementById('user-search').value.toLowerCase();
        const filterValue = document.getElementById('user-filter').value;

        this.filteredUsers = this.users.filter(user => {
            const matchesSearch = !searchTerm ||
                user.full_name?.toLowerCase().includes(searchTerm) ||
                user.email?.toLowerCase().includes(searchTerm);

            let matchesFilter = true;
            switch (filterValue) {
                case 'active':
                    matchesFilter = user.status === 'active';
                    break;
                case 'suspended':
                    matchesFilter = user.status === 'suspended';
                    break;
                case 'unverified':
                    matchesFilter = !user.email_confirmed_at;
                    break;
            }

            return matchesSearch && matchesFilter;
        });

        this.currentPageNum = 1;
        this.renderUsers();
    },

    // Render users table
    renderUsers() {
        const startIndex = (this.currentPageNum - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const usersToShow = this.filteredUsers.slice(startIndex, endIndex);

        const tbody = document.getElementById('users-tbody');
        tbody.innerHTML = usersToShow.map(user => `
            <tr>
                <td>${user.full_name || 'N/A'}</td>
                <td>${user.email}</td>
                <td>$${user.balance?.toFixed(2) || '0.00'}</td>
                <td><span class="status ${user.status || 'active'}">${user.status || 'active'}</span></td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>${user.last_login ? this.formatDate(user.last_login) : 'Never'}</td>
                <td class="user-actions">
                    <button class="btn btn-small btn-primary" onclick="admin.viewUser('${user.id}')">View</button>
                    <button class="btn btn-small btn-warning" onclick="admin.editUser('${user.id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="admin.deleteUser('${user.id}')">Delete</button>
                </td>
            </tr>
        `).join('');

        this.renderPagination();
    },

    // Render pagination
    renderPagination() {
        const totalPages = Math.ceil(this.filteredUsers.length / this.itemsPerPage);
        const pagination = document.getElementById('users-pagination');

        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `<button class="page-btn ${i === this.currentPageNum ? 'active' : ''}" onclick="admin.goToPage(${i})">${i}</button>`;
        }
        pagination.innerHTML = paginationHTML;
    },

    // Go to page
    goToPage(pageNum) {
        this.currentPageNum = pageNum;
        this.renderUsers();
    },

    // View user
    async viewUser(userId) {
        // TODO: Implement view user modal
        showToast('View user functionality coming soon', 'info');
    },

    // Edit user
    async editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('edit-full-name').value = user.full_name || '';
        document.getElementById('edit-email').value = user.email || '';
        document.getElementById('edit-balance').value = user.balance || 0;
        document.getElementById('edit-status').value = user.status || 'active';

        // Store current user ID for saving
        this.editingUserId = userId;

        openModal('edit-user-modal');
    },

    // Save user changes
    async saveUserChanges(e) {
        e.preventDefault();

        const fullName = document.getElementById('edit-full-name').value;
        const email = document.getElementById('edit-email').value;
        const balance = parseFloat(document.getElementById('edit-balance').value);
        const status = document.getElementById('edit-status').value;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    email: email,
                    balance: balance,
                    status: status,
                    updated_at: new Date().toISOString()
                })
                .eq('id', this.editingUserId);

            if (error) throw error;

            // Log activity
            await this.logActivity('User Updated', `Updated user ${email}`);

            showToast('User updated successfully', 'success');
            closeModal('edit-user-modal');
            this.loadUsers();
        } catch (error) {
            console.error('Error updating user:', error);
            showToast('Error updating user', 'error');
        }
    },

    // Delete user
    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            // Log activity
            await this.logActivity('User Deleted', `Deleted user ${userId}`);

            showToast('User deleted successfully', 'success');
            this.loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
            showToast('Error deleting user', 'error');
        }
    },

    // Load transactions
    async loadTransactions() {
        // TODO: Implement transactions loading
        const content = document.getElementById('transactions-content');
        content.innerHTML = '<p>Transactions management coming soon...</p>';
    },

    // Load withdrawals
    async loadWithdrawals() {
        // TODO: Implement withdrawals loading
        const content = document.getElementById('withdrawals-content');
        content.innerHTML = '<p>Withdrawals management coming soon...</p>';
    },

    // Load trades
    async loadTrades() {
        // TODO: Implement trades loading
        const content = document.getElementById('trades-content');
        content.innerHTML = '<p>Trades management coming soon...</p>';
    },

    // Load logs
    async loadLogs() {
        // TODO: Implement logs loading
        const content = document.getElementById('logs-content');
        content.innerHTML = '<p>Activity logs coming soon...</p>';
    },

    // Send broadcast
    async sendBroadcast(e) {
        e.preventDefault();

        const title = document.getElementById('broadcast-title').value;
        const message = document.getElementById('broadcast-message').value;
        const recipients = document.getElementById('broadcast-recipients').value;

        try {
            let userIds = [];

            if (recipients === 'all') {
                const { data: users } = await supabase.from('profiles').select('id');
                userIds = users.map(u => u.id);
            } else if (recipients === 'active') {
                // Get active users (logged in within last 7 days)
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
                const { data: users } = await supabase
                    .from('profiles')
                    .select('id')
                    .gte('last_login', weekAgo);
                userIds = users.map(u => u.id);
            } else if (recipients === 'select') {
                // Get selected users from checkboxes
                const checkboxes = document.querySelectorAll('#user-checkboxes input:checked');
                userIds = Array.from(checkboxes).map(cb => cb.value);
            }

            // Create notifications for each user
            const notifications = userIds.map(userId => ({
                user_id: userId,
                title: title,
                message: message,
                type: 'broadcast',
                created_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('notifications')
                .insert(notifications);

            if (error) throw error;

            // Log activity
            await this.logActivity('Broadcast Sent', `Sent broadcast to ${userIds.length} users`);

            showToast('Broadcast sent successfully', 'success');
            e.target.reset();
        } catch (error) {
            console.error('Error sending broadcast:', error);
            showToast('Error sending broadcast', 'error');
        }
    },

    // Load user checkboxes for broadcast
    async loadUserCheckboxes() {
        try {
            const { data: users, error } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .order('full_name');

            if (error) throw error;

            const container = document.getElementById('user-checkboxes');
            container.innerHTML = users.map(user => `
                <label style="display: block; margin-bottom: 0.5rem;">
                    <input type="checkbox" value="${user.id}" style="margin-right: 0.5rem;">
                    ${user.full_name || user.email}
                </label>
            `).join('');
        } catch (error) {
            console.error('Error loading user checkboxes:', error);
        }
    },

    // Log activity
    async logActivity(action, details) {
        try {
            await supabase
                .from('activity_logs')
                .insert({
                    admin_id: this.currentUser.id,
                    action: action,
                    details: details,
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    },

    // Utility functions
    getActivityIcon(action) {
        const icons = {
            'User Login': 'sign-in-alt',
            'User Updated': 'user-edit',
            'User Deleted': 'user-times',
            'Broadcast Sent': 'bullhorn',
            'Deposit Approved': 'check-circle',
            'Withdrawal Processed': 'money-check-alt'
        };
        return icons[action] || 'circle';
    },

    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
    },

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString();
    },

    // Export user data
    exportUserData() {
        // TODO: Implement CSV export
        showToast('Export functionality coming soon', 'info');
    },

    // Export transaction data
    exportTransactionData() {
        // TODO: Implement CSV export
        showToast('Export functionality coming soon', 'info');
    },

    // Refresh activity
    refreshActivity() {
        this.loadDashboardData();
        showToast('Data refreshed', 'success');
    }
};

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    admin.init();
});

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    if (modal && overlay) {
        modal.style.display = 'block';
        overlay.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    if (modal && overlay) {
        modal.style.display = 'none';
        overlay.style.display = 'none';
    }
}

// Logout function
function logoutAdmin() {
    supabase.auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
}

// Toast function
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Export admin object
export { admin };
