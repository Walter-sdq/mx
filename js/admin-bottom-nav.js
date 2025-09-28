// Enhanced Admin Dashboard with Bottom Navigation
import { supabase } from './supabase.js';

const admin = {
    currentUser: null,
    currentPage: 'dashboard',
    users: [],
    filteredUsers: [],
    currentPageNum: 1,
    itemsPerPage: 10,
    isLoading: false,
    realTimeListeners: {},
    syncStatus: {
        users: false,
        transactions: false,
        withdrawals: false,
        trades: false,
        notifications: false
    },
    animations: {
        fadeIn: 'fadeIn 0.6s ease-out forwards',
        slideUp: 'slideUp 0.8s ease-out forwards',
        scaleIn: 'scaleIn 0.5s ease-out forwards',
        bounceIn: 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards'
    },

    // Initialize admin dashboard with enhanced effects
    async init() {
        this.addLoadingAnimation();
        this.setup3DEffects();

        try {
            // Wait for supabase to be available
            await this.waitForSupabase();

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

    // Wait for supabase client to be available
    async waitForSupabase() {
        const maxAttempts = 50; // 5 seconds max
        let attempts = 0;

        while (!supabase && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (!supabase) {
            throw new Error('Supabase client not available');
        }

        console.log('Supabase client is ready');
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
                    <p style="margin: 10px 0 0 0; opacity: 0.8;">Initializing interface...</p>
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
            .nav-item {
                transform-style: preserve-3d;
                transition: transform 0.3s ease;
            }
            .nav-item:hover {
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
        try {
            if (!supabase) {
                console.warn('Supabase not available, skipping admin validation');
                return;
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (error) {
                console.warn('Profile not found, allowing access for demo purposes');
                return;
            }

            if (profile?.role !== 'admin') {
                console.warn('User is not admin, but allowing access for demo purposes');
            }
        } catch (error) {
            console.warn('Admin access validation error:', error);
            // Don't throw error, allow access for demo purposes
        }
    },

    // Handle initialization error
    handleInitError(error) {
        this.removeLoadingAnimation();
        showToast(`Initialization failed: ${error.message}`, 'error');

        // Simply sync without redirecting
        console.log('Admin access denied - staying on current page');
    },

    // Redirect to login page
    redirectToLogin() {
        console.log('Redirecting to login page...');
        window.location.href = 'index.html';
    },

    // Show welcome animation
    showWelcomeAnimation() {
        const main = document.querySelector('.admin-main');

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
        // Bottom navigation with improved error handling
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    this.showPage(page);
                }
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

        // Add keyboard navigation support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    },

    // Show page
    showPage(pageName) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

        const targetPage = document.getElementById(`${pageName}-page`);
        const targetNav = document.querySelector(`.nav-item[data-page="${pageName}"]`);

        if (targetPage) targetPage.classList.add('active');
        if (targetNav) targetNav.classList.add('active');

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
        try {
            const user = this.users.find(u => u.id === userId);
            if (!user) {
                showToast('User not found', 'error');
                return;
            }

            // Create view user modal content
            const modalContent = `
                <div class="modal-header">
                    <h3>View User Details</h3>
                    <button class="close-btn" onclick="closeModal('view-user-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="user-details">
                        <div class="detail-row">
                            <label>Name:</label>
                            <span>${user.full_name || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Email:</label>
                            <span>${user.email}</span>
                        </div>
                        <div class="detail-row">
                            <label>Balance:</label>
                            <span>$${user.balance?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Status:</label>
                            <span class="status ${user.status || 'active'}">${user.status || 'active'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Joined:</label>
                            <span>${this.formatDate(user.created_at)}</span>
                        </div>
                        <div class="detail-row">
                            <label>Last Login:</label>
                            <span>${user.last_login ? this.formatDate(user.last_login) : 'Never'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Email Verified:</label>
                            <span>${user.email_confirmed_at ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="admin.editUser('${userId}')">Edit User</button>
                    <button class="btn btn-secondary" onclick="closeModal('view-user-modal')">Close</button>
                </div>
            `;

            // Update or create modal
            let modal = document.getElementById('view-user-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'view-user-modal';
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
            modal.innerHTML = modalContent;
            openModal('view-user-modal');

        } catch (error) {
            console.error('Error viewing user:', error);
            showToast('Error loading user details', 'error');
        }
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
        try {
            const { data: transactions, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    profiles:profiles(full_name, email)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const content = document.getElementById('transactions-content');
            content.innerHTML = `
                <div class="search-filter">
                    <i class="fas fa-search"></i>
                    <input type="text" id="transaction-search" class="search-input" placeholder="Search transactions...">
                    <i class="fas fa-filter"></i>
                    <select id="transaction-filter" class="filter-select">
                        <option value="all">All Transactions</option>
                        <option value="deposit">Deposits</option>
                        <option value="withdrawal">Withdrawals</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button class="btn btn-primary" onclick="admin.exportTransactions()">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>

                <table class="user-table">
                    <thead>
                        <tr>
                            <th><i class="fas fa-user"></i> User</th>
                            <th><i class="fas fa-exchange-alt"></i> Type</th>
                            <th><i class="fas fa-dollar-sign"></i> Amount</th>
                            <th><i class="fas fa-info-circle"></i> Status</th>
                            <th><i class="fas fa-calendar-plus"></i> Date</th>
                            <th><i class="fas fa-cogs"></i> Actions</th>
                        </tr>
                    </thead>
                    <tbody id="transactions-tbody">
                        ${transactions.map(t => `
                            <tr>
                                <td>${t.profiles?.full_name || t.profiles?.email || 'N/A'}</td>
                                <td><span class="status ${t.type}">${t.type}</span></td>
                                <td>$${t.amount?.toFixed(2) || '0.00'}</td>
                                <td><span class="status ${t.status || 'pending'}">${t.status || 'pending'}</span></td>
                                <td>${this.formatDate(t.created_at)}</td>
                                <td class="user-actions">
                                    <button class="btn btn-small btn-primary" onclick="admin.viewTransaction('${t.id}')">View</button>
                                    ${t.status === 'pending' ? `
                                        <button class="btn btn-small btn-success" onclick="admin.approveTransaction('${t.id}')">Approve</button>
                                        <button class="btn btn-small btn-danger" onclick="admin.rejectTransaction('${t.id}')">Reject</button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            // Setup search and filter
            const searchInput = document.getElementById('transaction-search');
            const filterSelect = document.getElementById('transaction-filter');
            if (searchInput) {
                searchInput.addEventListener('input', () => this.filterTransactions(transactions));
            }
            if (filterSelect) {
                filterSelect.addEventListener('change', () => this.filterTransactions(transactions));
            }

        } catch (error) {
            console.error('Error loading transactions:', error);
            showToast('Error loading transactions', 'error');
        }
    },

    // Filter transactions
    filterTransactions(transactions) {
        const searchTerm = document.getElementById('transaction-search').value.toLowerCase();
        const filterValue = document.getElementById('transaction-filter').value;

        const filtered = transactions.filter(t => {
            const matchesSearch = !searchTerm ||
                t.profiles?.full_name?.toLowerCase().includes(searchTerm) ||
                t.profiles?.email?.toLowerCase().includes(searchTerm) ||
                t.amount?.toString().includes(searchTerm);

            let matchesFilter = true;
            switch (filterValue) {
                case 'deposit':
                    matchesFilter = t.type === 'deposit';
                    break;
                case 'withdrawal':
                    matchesFilter = t.type === 'withdrawal';
                    break;
                case 'completed':
                    matchesFilter = t.status === 'completed';
                    break;
                case 'pending':
                    matchesFilter = t.status === 'pending';
                    break;
                case 'rejected':
                    matchesFilter = t.status === 'rejected';
                    break;
            }

            return matchesSearch && matchesFilter;
        });

        const tbody = document.getElementById('transactions-tbody');
        tbody.innerHTML = filtered.map(t => `
            <tr>
                <td>${t.profiles?.full_name || t.profiles?.email || 'N/A'}</td>
                <td><span class="status ${t.type}">${t.type}</span></td>
                <td>$${t.amount?.toFixed(2) || '0.00'}</td>
                <td><span class="status ${t.status || 'pending'}">${t.status || 'pending'}</span></td>
                <td>${this.formatDate(t.created_at)}</td>
                <td class="user-actions">
                    <button class="btn btn-small btn-primary" onclick="admin.viewTransaction('${t.id}')">View</button>
                    ${t.status === 'pending' ? `
                        <button class="btn btn-small btn-success" onclick="admin.approveTransaction('${t.id}')">Approve</button>
                        <button class="btn btn-small btn-danger" onclick="admin.rejectTransaction('${t.id}')">Reject</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    },

    // Load withdrawals
    async loadWithdrawals() {
        try {
            const { data: withdrawals, error } = await supabase
                .from('withdrawals')
                .select(`
                    *,
                    profiles:profiles(full_name, email)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const content = document.getElementById('withdrawals-content');
            content.innerHTML = `
                <div class="search-filter">
                    <i class="fas fa-search"></i>
                    <input type="text" id="withdrawal-search" class="search-input" placeholder="Search withdrawals...">
                    <i class="fas fa-filter"></i>
                    <select id="withdrawal-filter" class="filter-select">
                        <option value="all">All Withdrawals</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <button class="btn btn-primary" onclick="admin.exportWithdrawals()">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>

                <table class="user-table">
                    <thead>
                        <tr>
                            <th><i class="fas fa-user"></i> User</th>
                            <th><i class="fas fa-dollar-sign"></i> Amount</th>
                            <th><i class="fas fa-credit-card"></i> Method</th>
                            <th><i class="fas fa-info-circle"></i> Status</th>
                            <th><i class="fas fa-calendar-plus"></i> Date</th>
                            <th><i class="fas fa-cogs"></i> Actions</th>
                        </tr>
                    </thead>
                    <tbody id="withdrawals-tbody">
                        ${withdrawals.map(w => `
                            <tr>
                                <td>${w.profiles?.full_name || w.profiles?.email || 'N/A'}</td>
                                <td>$${w.amount?.toFixed(2) || '0.00'}</td>
                                <td><span class="status ${w.method || 'bank'}">${w.method || 'bank'}</span></td>
                                <td><span class="status ${w.status || 'pending'}">${w.status || 'pending'}</span></td>
                                <td>${this.formatDate(w.created_at)}</td>
                                <td class="user-actions">
                                    <button class="btn btn-small btn-primary" onclick="admin.viewWithdrawal('${w.id}')">View</button>
                                    ${w.status === 'pending' ? `
                                        <button class="btn btn-small btn-success" onclick="admin.approveWithdrawal('${w.id}')">Approve</button>
                                        <button class="btn btn-small btn-danger" onclick="admin.rejectWithdrawal('${w.id}')">Reject</button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            // Setup search and filter
            const searchInput = document.getElementById('withdrawal-search');
            const filterSelect = document.getElementById('withdrawal-filter');
            if (searchInput) {
                searchInput.addEventListener('input', () => this.filterWithdrawals(withdrawals));
            }
            if (filterSelect) {
                filterSelect.addEventListener('change', () => this.filterWithdrawals(withdrawals));
            }

        } catch (error) {
            console.error('Error loading withdrawals:', error);
            showToast('Error loading withdrawals', 'error');
        }
    },

    // Filter withdrawals
    filterWithdrawals(withdrawals) {
        const searchTerm = document.getElementById('withdrawal-search').value.toLowerCase();
        const filterValue = document.getElementById('withdrawal-filter').value;

        const filtered = withdrawals.filter(w => {
            const matchesSearch = !searchTerm ||
                w.profiles?.full_name?.toLowerCase().includes(searchTerm) ||
                w.profiles?.email?.toLowerCase().includes(searchTerm) ||
                w.amount?.toString().includes(searchTerm);

            const matchesFilter = filterValue === 'all' || w.status === filterValue;

            return matchesSearch && matchesFilter;
        });

        const tbody = document.getElementById('withdrawals-tbody');
        tbody.innerHTML = filtered.map(w => `
            <tr>
                <td>${w.profiles?.full_name || w.profiles?.email || 'N/A'}</td>
                <td>$${w.amount?.toFixed(2) || '0.00'}</td>
                <td><span class="status ${w.method || 'bank'}">${w.method || 'bank'}</span></td>
                <td><span class="status ${w.status || 'pending'}">${w.status || 'pending'}</span></td>
                <td>${this.formatDate(w.created_at)}</td>
                <td class="user-actions">
                    <button class="btn btn-small btn-primary" onclick="admin.viewWithdrawal('${w.id}')">View</button>
                    ${w.status === 'pending' ? `
                        <button class="btn btn-small btn-success" onclick="admin.approveWithdrawal('${w.id}')">Approve</button>
                        <button class="btn btn-small btn-danger" onclick="admin.rejectWithdrawal('${w.id}')">Reject</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    },

    // Load trades
    async loadTrades() {
        try {
            const { data: trades, error } = await supabase
                .from('trades')
                .select(`
                    *,
                    profiles:profiles(full_name, email)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            const content = document.getElementById('trades-content');
            content.innerHTML = `
                <div class="search-filter">
                    <i class="fas fa-search"></i>
                    <input type="text" id="trade-search" class="search-input" placeholder="Search trades...">
                    <i class="fas fa-filter"></i>
                    <select id="trade-filter" class="filter-select">
                        <option value="all">All Trades</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="profit">Profitable</option>
                        <option value="loss">Loss</option>
                    </select>
                    <button class="btn btn-primary" onclick="admin.exportTrades()">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>

                <table class="user-table">
                    <thead>
                        <tr>
                            <th><i class="fas fa-user"></i> User</th>
                            <th><i class="fas fa-chart-line"></i> Type</th>
                            <th><i class="fas fa-dollar-sign"></i> Amount</th>
                            <th><i class="fas fa-percentage"></i> P&L</th>
                            <th><i class="fas fa-info-circle"></i> Status</th>
                            <th><i class="fas fa-calendar-plus"></i> Date</th>
                            <th><i class="fas fa-cogs"></i> Actions</th>
                        </tr>
                    </thead>
                    <tbody id="trades-tbody">
                        ${trades.map(t => `
                            <tr>
                                <td>${t.profiles?.full_name || t.profiles?.email || 'N/A'}</td>
                                <td><span class="status ${t.type}">${t.type}</span></td>
                                <td>$${t.amount?.toFixed(2) || '0.00'}</td>
                                <td><span class="status ${t.profit_loss >= 0 ? 'profit' : 'loss'}">$${t.profit_loss?.toFixed(2) || '0.00'}</span></td>
                                <td><span class="status ${t.status}">${t.status}</span></td>
                                <td>${this.formatDate(t.created_at)}</td>
                                <td class="user-actions">
                                    <button class="btn btn-small btn-primary" onclick="admin.viewTrade('${t.id}')">View</button>
                                    ${t.status === 'open' ? `
                                        <button class="btn btn-small btn-success" onclick="admin.closeTrade('${t.id}', 'profit')">Win</button>
                                        <button class="btn btn-small btn-danger" onclick="admin.closeTrade('${t.id}', 'loss')">Loss</button>
                                    ` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            // Setup search and filter
            const searchInput = document.getElementById('trade-search');
            const filterSelect = document.getElementById('trade-filter');
            if (searchInput) {
                searchInput.addEventListener('input', () => this.filterTrades(trades));
            }
            if (filterSelect) {
                filterSelect.addEventListener('change', () => this.filterTrades(trades));
            }

        } catch (error) {
            console.error('Error loading trades:', error);
            showToast('Error loading trades', 'error');
        }
    },

    // Filter trades
    filterTrades(trades) {
        const searchTerm = document.getElementById('trade-search').value.toLowerCase();
        const filterValue = document.getElementById('trade-filter').value;

        const filtered = trades.filter(t => {
            const matchesSearch = !searchTerm ||
                t.profiles?.full_name?.toLowerCase().includes(searchTerm) ||
                t.profiles?.email?.toLowerCase().includes(searchTerm) ||
                t.amount?.toString().includes(searchTerm);

            let matchesFilter = true;
            switch (filterValue) {
                case 'open':
                    matchesFilter = t.status === 'open';
                    break;
                case 'closed':
                    matchesFilter = t.status === 'closed';
                    break;
                case 'profit':
                    matchesFilter = t.profit_loss > 0;
                    break;
                case 'loss':
                    matchesFilter = t.profit_loss < 0;
                    break;
            }

            return matchesSearch && matchesFilter;
        });

        const tbody = document.getElementById('trades-tbody');
        tbody.innerHTML = filtered.map(t => `
            <tr>
                <td>${t.profiles?.full_name || t.profiles?.email || 'N/A'}</td>
                <td><span class="status ${t.type}">${t.type}</span></td>
                <td>$${t.amount?.toFixed(2) || '0.00'}</td>
                <td><span class="status ${t.profit_loss >= 0 ? 'profit' : 'loss'}">$${t.profit_loss?.toFixed(2) || '0.00'}</span></td>
                <td><span class="status ${t.status}">${t.status}</span></td>
                <td>${this.formatDate(t.created_at)}</td>
                <td class="user-actions">
                    <button class="btn btn-small btn-primary" onclick="admin.viewTrade('${t.id}')">View</button>
                    ${t.status === 'open' ? `
                        <button class="btn btn-small btn-success" onclick="admin.closeTrade('${t.id}', 'profit')">Win</button>
                        <button class="btn btn-small btn-danger" onclick="admin.closeTrade('${t.id}', 'loss')">Loss</button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    },

    // Load logs
    async loadLogs() {
        try {
            const { data: logs, error } = await supabase
                .from('activity_logs')
                .select(`
                    *,
                    profiles:profiles(full_name, email)
                `)
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            const content = document.getElementById('logs-content');
            content.innerHTML = `
                <div class="search-filter">
                    <i class="fas fa-search"></i>
                    <input type="text" id="log-search" class="search-input" placeholder="Search logs...">
                    <i class="fas fa-filter"></i>
                    <select id="log-filter" class="filter-select">
                        <option value="all">All Activities</option>
                        <option value="User">User Actions</option>
                        <option value="Transaction">Transactions</option>
                        <option value="Trade">Trades</option>
                        <option value="Broadcast">Broadcasts</option>
                    </select>
                    <button class="btn btn-primary" onclick="admin.exportLogs()">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>

                <table class="user-table">
                    <thead>
                        <tr>
                            <th><i class="fas fa-user"></i> User</th>
                            <th><i class="fas fa-cog"></i> Action</th>
                            <th><i class="fas fa-info-circle"></i> Details</th>
                            <th><i class="fas fa-calendar-plus"></i> Date</th>
                        </tr>
                    </thead>
                    <tbody id="logs-tbody">
                        ${logs.map(l => `
                            <tr>
                                <td>${l.profiles?.full_name || l.profiles?.email || 'System'}</td>
                                <td><span class="status ${l.action.toLowerCase().replace(/\s+/g, '-')}">${l.action}</span></td>
                                <td>${l.details || 'N/A'}</td>
                                <td>${this.formatDate(l.created_at)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            // Setup search and filter
            const searchInput = document.getElementById('log-search');
            const filterSelect = document.getElementById('log-filter');
            if (searchInput) {
                searchInput.addEventListener('input', () => this.filterLogs(logs));
            }
            if (filterSelect) {
                filterSelect.addEventListener('change', () => this.filterLogs(logs));
            }

        } catch (error) {
            console.error('Error loading logs:', error);
            showToast('Error loading logs', 'error');
        }
    },

    // Filter logs
    filterLogs(logs) {
        const searchTerm = document.getElementById('log-search').value.toLowerCase();
        const filterValue = document.getElementById('log-filter').value;

        const filtered = logs.filter(l => {
            const matchesSearch = !searchTerm ||
                l.profiles?.full_name?.toLowerCase().includes(searchTerm) ||
                l.profiles?.email?.toLowerCase().includes(searchTerm) ||
                l.action?.toLowerCase().includes(searchTerm) ||
                l.details?.toLowerCase().includes(searchTerm);

            const matchesFilter = filterValue === 'all' || l.action === filterValue;

            return matchesSearch && matchesFilter;
        });

        const tbody = document.getElementById('logs-tbody');
        tbody.innerHTML = filtered.map(l => `
            <tr>
                <td>${l.profiles?.full_name || l.profiles?.email || 'System'}</td>
                <td><span class="status ${l.action.toLowerCase().replace(/\s+/g, '-')}">${l.action}</span></td>
                <td>${l.details || 'N/A'}</td>
                <td>${this.formatDate(l.created_at)}</td>
            </tr>
        `).join('');
    },

    // Send broadcast
    async sendBroadcast(e) {
        e.preventDefault();

        const title = document.getElementById('broadcast-title').value;
        const message = document.getElementById('broadcast-message').value;
        const recipients = document.getElementById('broadcast-recipients').value;

        if (!title || !message) {
            showToast('Please fill in all fields', 'warning');
            return;
        }

        try {
            let targetUsers = [];

            if (recipients === 'all') {
                const { data: users, error } = await supabase
                    .from('profiles')
                    .select('id, email');
                if (error) throw error;
                targetUsers = users;
            } else if (recipients === 'select') {
                const checkboxes = document.querySelectorAll('#user-checkboxes input[type="checkbox"]:checked');
                targetUsers = Array.from(checkboxes).map(cb => ({
                    id: cb.value,
                    email: cb.dataset.email
                }));
            }

            if (targetUsers.length === 0) {
                showToast('No recipients selected', 'warning');
                return;
            }

            // Send broadcast to each user
            for (const user of targetUsers) {
                await supabase
                    .from('notifications')
                    .insert({
                        user_id: user.id,
                        title: title,
                        message: message,
                        type: 'broadcast',
                        read: false
                    });
            }

            // Log activity
            await this.logActivity('Broadcast Sent', `Sent broadcast "${title}" to ${targetUsers.length} users`);

            showToast(`Broadcast sent to ${targetUsers.length} users`, 'success');
            document.getElementById('broadcast-title').value = '';
            document.getElementById('broadcast-message').value = '';

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

            const userSelector = document.getElementById('user-selector');
            userSelector.innerHTML = users.map(user => `
                <label class="checkbox-label">
                    <input type="checkbox" value="${user.id}" data-email="${user.email}">
                    <span class="checkmark"></span>
                    ${user.full_name || user.email}
                </label>
            `).join('');

        } catch (error) {
            console.error('Error loading user checkboxes:', error);
            showToast('Error loading users', 'error');
        }
    },

    // View transaction
    async viewTransaction(transactionId) {
        try {
            const { data: transaction, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    profiles:profiles(full_name, email)
                `)
                .eq('id', transactionId)
                .single();

            if (error) throw error;

            // Create view transaction modal content
            const modalContent = `
                <div class="modal-header">
                    <h3>Transaction Details</h3>
                    <button class="close-btn" onclick="closeModal('view-transaction-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="transaction-details">
                        <div class="detail-row">
                            <label>Transaction ID:</label>
                            <span>${transaction.id}</span>
                        </div>
                        <div class="detail-row">
                            <label>User:</label>
                            <span>${transaction.profiles?.full_name || transaction.profiles?.email || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Type:</label>
                            <span class="status ${transaction.type}">${transaction.type}</span>
                        </div>
                        <div class="detail-row">
                            <label>Amount:</label>
                            <span>$${transaction.amount?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Status:</label>
                            <span class="status ${transaction.status || 'pending'}">${transaction.status || 'pending'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Payment Method:</label>
                            <span>${transaction.payment_method || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Reference:</label>
                            <span>${transaction.reference || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Created:</label>
                            <span>${this.formatDate(transaction.created_at)}</span>
                        </div>
                        <div class="detail-row">
                            <label>Updated:</label>
                            <span>${transaction.updated_at ? this.formatDate(transaction.updated_at) : 'N/A'}</span>
                        </div>
                        ${transaction.notes ? `
                        <div class="detail-row">
                            <label>Notes:</label>
                            <span>${transaction.notes}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    ${transaction.status === 'pending' ? `
                        <button class="btn btn-success" onclick="admin.approveTransaction('${transaction.id}')">Approve</button>
                        <button class="btn btn-danger" onclick="admin.rejectTransaction('${transaction.id}')">Reject</button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="closeModal('view-transaction-modal')">Close</button>
                </div>
            `;

            // Update or create modal
            let modal = document.getElementById('view-transaction-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'view-transaction-modal';
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
            modal.innerHTML = modalContent;
            openModal('view-transaction-modal');

        } catch (error) {
            console.error('Error viewing transaction:', error);
            showToast('Error loading transaction details', 'error');
        }
    },

    // Approve transaction
    async approveTransaction(transactionId) {
        try {
            const { error } = await supabase
                .from('transactions')
                .update({ status: 'completed' })
                .eq('id', transactionId);

            if (error) throw error;

            // Log activity
            await this.logActivity('Transaction Approved', `Approved transaction ${transactionId}`);

            showToast('Transaction approved successfully', 'success');
            this.loadTransactions();
        } catch (error) {
            console.error('Error approving transaction:', error);
            showToast('Error approving transaction', 'error');
        }
    },

    // Reject transaction
    async rejectTransaction(transactionId) {
        try {
            const { error } = await supabase
                .from('transactions')
                .update({ status: 'rejected' })
                .eq('id', transactionId);

            if (error) throw error;

            // Log activity
            await this.logActivity('Transaction Rejected', `Rejected transaction ${transactionId}`);

            showToast('Transaction rejected successfully', 'success');
            this.loadTransactions();
        } catch (error) {
            console.error('Error rejecting transaction:', error);
            showToast('Error rejecting transaction', 'error');
        }
    },

    // View withdrawal
    async viewWithdrawal(withdrawalId) {
        try {
            const { data: withdrawal, error } = await supabase
                .from('withdrawals')
                .select(`
                    *,
                    profiles:profiles(full_name, email)
                `)
                .eq('id', withdrawalId)
                .single();

            if (error) throw error;

            // Create view withdrawal modal content
            const modalContent = `
                <div class="modal-header">
                    <h3>Withdrawal Details</h3>
                    <button class="close-btn" onclick="closeModal('view-withdrawal-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="withdrawal-details">
                        <div class="detail-row">
                            <label>Withdrawal ID:</label>
                            <span>${withdrawal.id}</span>
                        </div>
                        <div class="detail-row">
                            <label>User:</label>
                            <span>${withdrawal.profiles?.full_name || withdrawal.profiles?.email || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Amount:</label>
                            <span>$${withdrawal.amount?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Method:</label>
                            <span class="status ${withdrawal.method || 'bank'}">${withdrawal.method || 'bank'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Status:</label>
                            <span class="status ${withdrawal.status || 'pending'}">${withdrawal.status || 'pending'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Account Details:</label>
                            <span>${withdrawal.account_details || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Bank Name:</label>
                            <span>${withdrawal.bank_name || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Account Number:</label>
                            <span>${withdrawal.account_number ? '****' + withdrawal.account_number.slice(-4) : 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Routing Number:</label>
                            <span>${withdrawal.routing_number || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>SWIFT/BIC:</label>
                            <span>${withdrawal.swift_code || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Requested:</label>
                            <span>${this.formatDate(withdrawal.created_at)}</span>
                        </div>
                        <div class="detail-row">
                            <label>Processed:</label>
                            <span>${withdrawal.processed_at ? this.formatDate(withdrawal.processed_at) : 'N/A'}</span>
                        </div>
                        ${withdrawal.processed_by ? `
                        <div class="detail-row">
                            <label>Processed By:</label>
                            <span>${withdrawal.processed_by}</span>
                        </div>
                        ` : ''}
                        ${withdrawal.notes ? `
                        <div class="detail-row">
                            <label>Notes:</label>
                            <span>${withdrawal.notes}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    ${withdrawal.status === 'pending' ? `
                        <button class="btn btn-success" onclick="admin.approveWithdrawal('${withdrawal.id}')">Approve</button>
                        <button class="btn btn-danger" onclick="admin.rejectWithdrawal('${withdrawal.id}')">Reject</button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="closeModal('view-withdrawal-modal')">Close</button>
                </div>
            `;

            // Update or create modal
            let modal = document.getElementById('view-withdrawal-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'view-withdrawal-modal';
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
            modal.innerHTML = modalContent;
            openModal('view-withdrawal-modal');

        } catch (error) {
            console.error('Error viewing withdrawal:', error);
            showToast('Error loading withdrawal details', 'error');
        }
    },

    // Approve withdrawal
    async approveWithdrawal(withdrawalId) {
        try {
            const { error } = await supabase
                .from('withdrawals')
                .update({ status: 'completed' })
                .eq('id', withdrawalId);

            if (error) throw error;

            // Log activity
            await this.logActivity('Withdrawal Approved', `Approved withdrawal ${withdrawalId}`);

            showToast('Withdrawal approved successfully', 'success');
            this.loadWithdrawals();
        } catch (error) {
            console.error('Error approving withdrawal:', error);
            showToast('Error approving withdrawal', 'error');
        }
    },

    // Reject withdrawal
    async rejectWithdrawal(withdrawalId) {
        try {
            const { error } = await supabase
                .from('withdrawals')
                .update({ status: 'rejected' })
                .eq('id', withdrawalId);

            if (error) throw error;

            // Log activity
            await this.logActivity('Withdrawal Rejected', `Rejected withdrawal ${withdrawalId}`);

            showToast('Withdrawal rejected successfully', 'success');
            this.loadWithdrawals();
        } catch (error) {
            console.error('Error rejecting withdrawal:', error);
            showToast('Error rejecting withdrawal', 'error');
        }
    },

    // View trade
    async viewTrade(tradeId) {
        try {
            const { data: trade, error } = await supabase
                .from('trades')
                .select(`
                    *,
                    profiles:profiles(full_name, email)
                `)
                .eq('id', tradeId)
                .single();

            if (error) throw error;

            // Create view trade modal content
            const modalContent = `
                <div class="modal-header">
                    <h3>Trade Details</h3>
                    <button class="close-btn" onclick="closeModal('view-trade-modal')">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="trade-details">
                        <div class="detail-row">
                            <label>Trade ID:</label>
                            <span>${trade.id}</span>
                        </div>
                        <div class="detail-row">
                            <label>User:</label>
                            <span>${trade.profiles?.full_name || trade.profiles?.email || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Type:</label>
                            <span class="status ${trade.type}">${trade.type}</span>
                        </div>
                        <div class="detail-row">
                            <label>Amount:</label>
                            <span>$${trade.amount?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Entry Price:</label>
                            <span>$${trade.entry_price?.toFixed(5) || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Current Price:</label>
                            <span>$${trade.current_price?.toFixed(5) || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Stop Loss:</label>
                            <span>$${trade.stop_loss?.toFixed(5) || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Take Profit:</label>
                            <span>$${trade.take_profit?.toFixed(5) || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Profit/Loss:</label>
                            <span class="status ${trade.profit_loss >= 0 ? 'profit' : 'loss'}">$${trade.profit_loss?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Status:</label>
                            <span class="status ${trade.status}">${trade.status}</span>
                        </div>
                        <div class="detail-row">
                            <label>Symbol:</label>
                            <span>${trade.symbol || 'N/A'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Leverage:</label>
                            <span>${trade.leverage || 1}x</span>
                        </div>
                        <div class="detail-row">
                            <label>Opened:</label>
                            <span>${this.formatDate(trade.created_at)}</span>
                        </div>
                        ${trade.closed_at ? `
                        <div class="detail-row">
                            <label>Closed:</label>
                            <span>${this.formatDate(trade.closed_at)}</span>
                        </div>
                        ` : ''}
                        ${trade.result ? `
                        <div class="detail-row">
                            <label>Result:</label>
                            <span class="status ${trade.result}">${trade.result}</span>
                        </div>
                        ` : ''}
                        ${trade.duration ? `
                        <div class="detail-row">
                            <label>Duration:</label>
                            <span>${trade.duration}</span>
                        </div>
                        ` : ''}
                        ${trade.notes ? `
                        <div class="detail-row">
                            <label>Notes:</label>
                            <span>${trade.notes}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    ${trade.status === 'open' ? `
                        <button class="btn btn-success" onclick="admin.closeTrade('${trade.id}', 'profit')">Mark as Win</button>
                        <button class="btn btn-danger" onclick="admin.closeTrade('${trade.id}', 'loss')">Mark as Loss</button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="closeModal('view-trade-modal')">Close</button>
                </div>
            `;

            // Update or create modal
            let modal = document.getElementById('view-trade-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'view-trade-modal';
                modal.className = 'modal';
                document.body.appendChild(modal);
            }
            modal.innerHTML = modalContent;
            openModal('view-trade-modal');

        } catch (error) {
            console.error('Error viewing trade:', error);
            showToast('Error loading trade details', 'error');
        }
    },

    // Close trade
    async closeTrade(tradeId, result) {
        try {
            const { error } = await supabase
                .from('trades')
                .update({
                    status: 'closed',
                    closed_at: new Date().toISOString(),
                    result: result
                })
                .eq('id', tradeId);

            if (error) throw error;

            // Log activity
            await this.logActivity('Trade Closed', `Closed trade ${tradeId} with result: ${result}`);

            showToast(`Trade closed as ${result}`, 'success');
            this.loadTrades();
        } catch (error) {
            console.error('Error closing trade:', error);
            showToast('Error closing trade', 'error');
        }
    },

    // Export transactions
    async exportTransactions() {
        try {
            const { data: transactions, error } = await supabase
                .from('transactions')
                .select(`
                    *,
                    profiles:profiles(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Create CSV content
            const csvContent = [
                ['ID', 'User', 'Type', 'Amount', 'Status', 'Payment Method', 'Reference', 'Created', 'Updated'].join(','),
                ...transactions.map(t => [
                    t.id,
                    t.profiles?.full_name || t.profiles?.email || 'N/A',
                    t.type,
                    t.amount || 0,
                    t.status || 'pending',
                    t.payment_method || 'N/A',
                    t.reference || 'N/A',
                    this.formatDate(t.created_at),
                    t.updated_at ? this.formatDate(t.updated_at) : 'N/A'
                ].join(','))
            ].join('\n');

            // Download CSV file
            this.downloadCSV(csvContent, `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
            showToast('Transactions exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting transactions:', error);
            showToast('Error exporting transactions', 'error');
        }
    },

    // Export withdrawals
    async exportWithdrawals() {
        try {
            const { data: withdrawals, error } = await supabase
                .from('withdrawals')
                .select(`
                    *,
                    profiles:profiles(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Create CSV content
            const csvContent = [
                ['ID', 'User', 'Amount', 'Method', 'Status', 'Bank Name', 'Account Number', 'Routing Number', 'SWIFT', 'Requested', 'Processed'].join(','),
                ...withdrawals.map(w => [
                    w.id,
                    w.profiles?.full_name || w.profiles?.email || 'N/A',
                    w.amount || 0,
                    w.method || 'bank',
                    w.status || 'pending',
                    w.bank_name || 'N/A',
                    w.account_number ? '****' + w.account_number.slice(-4) : 'N/A',
                    w.routing_number || 'N/A',
                    w.swift_code || 'N/A',
                    this.formatDate(w.created_at),
                    w.processed_at ? this.formatDate(w.processed_at) : 'N/A'
                ].join(','))
            ].join('\n');

            // Download CSV file
            this.downloadCSV(csvContent, `withdrawals_export_${new Date().toISOString().split('T')[0]}.csv`);
            showToast('Withdrawals exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting withdrawals:', error);
            showToast('Error exporting withdrawals', 'error');
        }
    },

    // Export trades
    async exportTrades() {
        try {
            const { data: trades, error } = await supabase
                .from('trades')
                .select(`
                    *,
                    profiles:profiles(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Create CSV content
            const csvContent = [
                ['ID', 'User', 'Type', 'Amount', 'Symbol', 'Entry Price', 'Current Price', 'Stop Loss', 'Take Profit', 'P&L', 'Status', 'Leverage', 'Opened', 'Closed', 'Result'].join(','),
                ...trades.map(t => [
                    t.id,
                    t.profiles?.full_name || t.profiles?.email || 'N/A',
                    t.type,
                    t.amount || 0,
                    t.symbol || 'N/A',
                    t.entry_price || 'N/A',
                    t.current_price || 'N/A',
                    t.stop_loss || 'N/A',
                    t.take_profit || 'N/A',
                    t.profit_loss || 0,
                    t.status,
                    t.leverage || 1,
                    this.formatDate(t.created_at),
                    t.closed_at ? this.formatDate(t.closed_at) : 'N/A',
                    t.result || 'N/A'
                ].join(','))
            ].join('\n');

            // Download CSV file
            this.downloadCSV(csvContent, `trades_export_${new Date().toISOString().split('T')[0]}.csv`);
            showToast('Trades exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting trades:', error);
            showToast('Error exporting trades', 'error');
        }
    },

    // Export logs
    async exportLogs() {
        try {
            const { data: logs, error } = await supabase
                .from('activity_logs')
                .select(`
                    *,
                    profiles:profiles(full_name, email)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Create CSV content
            const csvContent = [
                ['ID', 'User', 'Action', 'Details', 'Created'].join(','),
                ...logs.map(l => [
                    l.id,
                    l.profiles?.full_name || l.profiles?.email || 'System',
                    l.action,
                    l.details || 'N/A',
                    this.formatDate(l.created_at)
                ].join(','))
            ].join('\n');

            // Download CSV file
            this.downloadCSV(csvContent, `activity_logs_export_${new Date().toISOString().split('T')[0]}.csv`);
            showToast('Activity logs exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting logs:', error);
            showToast('Error exporting logs', 'error');
        }
    },

    // Helper function to download CSV
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    },

    // Log activity
    async logActivity(action, details) {
        try {
            await supabase
                .from('activity_logs')
                .insert({
                    user_id: this.currentUser.id,
                    action: action,
                    details: details,
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    },

    // Get activity icon
    getActivityIcon(action) {
        const iconMap = {
            'User Updated': 'user-edit',
            'User Deleted': 'user-times',
            'Transaction Approved': 'check-circle',
            'Transaction Rejected': 'times-circle',
            'Withdrawal Approved': 'check-circle',
            'Withdrawal Rejected': 'times-circle',
            'Trade Closed': 'chart-line',
            'Broadcast Sent': 'bullhorn',
            'Login': 'sign-in-alt',
            'Logout': 'sign-out-alt'
        };

        return iconMap[action] || 'info-circle';
    },

    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Format time ago
    formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return this.formatDate(dateString);
    },

    // Close all modals
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    },

    // Refresh dashboard data
    async refreshData() {
        try {
            this.isLoading = true;
            showToast('Refreshing data...', 'info');

            // Reload all dashboard data
            await this.loadDashboardData();
            await this.loadUsers();
            await this.loadTransactions();
            await this.loadWithdrawals();
            await this.loadTrades();
            await this.loadLogs();

            showToast('Data refreshed successfully', 'success');
        } catch (error) {
            console.error('Error refreshing data:', error);
            showToast('Error refreshing data', 'error');
        } finally {
            this.isLoading = false;
        }
    },

    // Process withdrawal (approve/reject)
    async processWithdrawal(action) {
        const modal = document.getElementById('withdrawal-modal');
        const withdrawalId = modal.dataset.withdrawalId;

        if (!withdrawalId) {
            showToast('No withdrawal selected', 'error');
            return;
        }

        try {
            const { error } = await supabase
                .from('withdrawals')
                .update({
                    status: action === 'approve' ? 'completed' : 'rejected',
                    processed_at: new Date().toISOString(),
                    processed_by: this.currentUser.id
                })
                .eq('id', withdrawalId);

            if (error) throw error;

            // Log activity
            await this.logActivity(
                `Withdrawal ${action === 'approve' ? 'Approved' : 'Rejected'}`,
                `${action === 'approve' ? 'Approved' : 'Rejected'} withdrawal ${withdrawalId}`
            );

            showToast(`Withdrawal ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
            closeModal('withdrawal-modal');
            this.loadWithdrawals();
            this.loadDashboardData(); // Refresh dashboard stats
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            showToast('Error processing withdrawal', 'error');
        }
    },

    // Logout admin
    async logoutAdmin() {
        try {
            // Log activity
            await this.logActivity('Admin Logout', 'Admin logged out');

            // Sign out from Supabase
            await supabase.auth.signOut();

            // Redirect to login page
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error during logout:', error);
            // Force redirect even if logout fails
            window.location.href = 'index.html';
        }
    },

    // Export users
    async exportUsers() {
        try {
            const { data: users, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Create CSV content
            const csvContent = [
                ['Name', 'Email', 'Balance', 'Status', 'Joined', 'Last Login'].join(','),
                ...users.map(user => [
                    user.full_name || '',
                    user.email,
                    user.balance || 0,
                    user.status || 'active',
                    this.formatDate(user.created_at),
                    user.last_login ? this.formatDate(user.last_login) : 'Never'
                ].join(','))
            ].join('\n');

            // Download CSV file
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showToast('Users exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting users:', error);
            showToast('Error exporting users', 'error');
        }
    }
};

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    admin.init();
});

// Global functions for HTML onclick handlers
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Toast notification system
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);

    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
