// Enhanced 3D Admin Dashboard with Full Synchronization
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
        
        // Redirect to main dashboard instead of showing access denied screen
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 3000);
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
            // Get current user data for comparison
            const currentUser = this.users.find(u => u.id === this.editingUserId);
            const balanceChange = balance - (currentUser.balance || 0);

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

            // Log balance adjustment if balance changed
            if (balanceChange !== 0) {
                await this.logActivity('Balance Adjusted', `Adjusted balance for ${email} by ${balanceChange > 0 ? '+' : ''}$${balanceChange.toFixed(2)} (New balance: $${balance.toFixed(2)})`);

                // Create a transaction record for balance adjustment
                await supabase
                    .from('transactions')
                    .insert({
                        user_id: this.editingUserId,
                        type: balanceChange > 0 ? 'deposit' : 'withdrawal',
                        amount: Math.abs(balanceChange),
                        status: 'completed',
                        description: `Admin balance adjustment: ${balanceChange > 0 ? 'Added' : 'Deducted'} $${Math.abs(balanceChange).toFixed(2)}`,
                        created_at: new Date().toISOString()
                    });
            }

            // Log other changes
            if (currentUser.status !== status) {
                await this.logActivity('User Status Changed', `Changed status for ${email} from ${currentUser.status} to ${status}`);
            }

            showToast('User updated successfully', 'success');
            closeModal('edit-user-modal');
            this.loadUsers();
            this.loadDashboardData(); // Refresh dashboard stats
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
                                <td>${t.amount?.toFixed(2) || '0.00'}</td>
                                <td><span class="status ${t.profit_loss >= 0 ? 'profit' : 'loss'}">${t.profit_loss?.toFixed(2) || '0.00'}</span></td>
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
                <td>${t.amount?.toFixed(2) || '0.00'}</td>
                <td><span class="status ${t.profit_loss >= 0 ? 'profit' : 'loss'}">${t.profit_loss?.toFixed(2) || '0.00'}</span></td>
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

                <div class="activity-log">
                    <div id="logs-list">
                        ${logs.map(log => `
                            <div class="activity-item">
                                <div class="activity-icon">
                                    <i class="fas fa-${this.getActivityIcon(log.action)}"></i>
                                </div>
                                <div class="activity-content">
                                    <div class="activity-title">${log.action}</div>
                                    <div class="activity-details">${log.details}</div>
                                    <div class="activity-time">${this.formatTimeAgo(log.created_at)}</div>
                                    <div class="activity-user">by ${log.profiles?.full_name || log.profiles?.email || 'System'}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
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

        const filtered = logs.filter(log => {
            const matchesSearch = !searchTerm ||
                log.action.toLowerCase().includes(searchTerm) ||
                log.details.toLowerCase().includes(searchTerm) ||
                log.profiles?.full_name?.toLowerCase().includes(searchTerm) ||
                log.profiles?.email?.toLowerCase().includes(searchTerm);

            let matchesFilter = true;
            switch (filterValue) {
                case 'User':
                    matchesFilter = log.action.includes('User');
                    break;
                case 'Transaction':
                    matchesFilter = log.action.includes('Transaction') || log.action.includes('Deposit') || log.action.includes('Withdrawal');
                    break;
                case 'Trade':
                    matchesFilter = log.action.includes('Trade');
                    break;
                case 'Broadcast':
                    matchesFilter = log.action.includes('Broadcast');
                    break;
            }

            return matchesSearch && matchesFilter;
        });

        const logsList = document.getElementById('logs-list');
        logsList.innerHTML = filtered.map(log => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(log.action)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${log.action}</div>
                    <div class="activity-details">${log.details}</div>
                    <div class="activity-time">${this.formatTimeAgo(log.created_at)}</div>
                    <div class="activity-user">by ${log.profiles?.full_name || log.profiles?.email || 'System'}</div>
                </div>
            </div>
        `).join('');
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
    },

    // Setup real-time synchronization
    async setupRealTimeSync() {
        try {
            // Setup real-time listeners for all data types
            await Promise.all([
                this.setupUserSync(),
                this.setupTransactionSync(),
                this.setupWithdrawalSync(),
                this.setupTradeSync(),
                this.setupNotificationSync()
            ]);

            this.syncStatus = {
                users: true,
                transactions: true,
                withdrawals: true,
                trades: true,
                notifications: true
            };

            showToast('Real-time sync activated', 'success');
        } catch (error) {
            console.error('Error setting up real-time sync:', error);
            showToast('Error setting up real-time sync', 'error');
        }
    },

    // Setup user synchronization
    async setupUserSync() {
        const usersSubscription = supabase
            .channel('admin-users')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles'
            }, (payload) => {
                this.handleUserChange(payload);
            })
            .subscribe();

        this.realTimeListeners.users = usersSubscription;
    },

    // Setup transaction synchronization
    async setupTransactionSync() {
        const transactionsSubscription = supabase
            .channel('admin-transactions')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'transactions'
            }, (payload) => {
                this.handleTransactionChange(payload);
            })
            .subscribe();

        this.realTimeListeners.transactions = transactionsSubscription;
    },

    // Setup withdrawal synchronization
    async setupWithdrawalSync() {
        const withdrawalsSubscription = supabase
            .channel('admin-withdrawals')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'withdrawals'
            }, (payload) => {
                this.handleWithdrawalChange(payload);
            })
            .subscribe();

        this.realTimeListeners.withdrawals = withdrawalsSubscription;
    },

    // Setup trade synchronization
    async setupTradeSync() {
        const tradesSubscription = supabase
            .channel('admin-trades')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'trades'
            }, (payload) => {
                this.handleTradeChange(payload);
            })
            .subscribe();

        this.realTimeListeners.trades = tradesSubscription;
    },

    // Setup notification synchronization
    async setupNotificationSync() {
        const notificationsSubscription = supabase
            .channel('admin-notifications')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications'
            }, (payload) => {
                this.handleNotificationChange(payload);
            })
            .subscribe();

        this.realTimeListeners.notifications = notificationsSubscription;
    },

    // Handle user changes
    async handleUserChange(payload) {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        switch (eventType) {
            case 'INSERT':
                this.users.unshift(newRecord);
                await this.logActivity('New User Registered', `User ${newRecord.email} registered`);
                break;
            case 'UPDATE':
                const index = this.users.findIndex(u => u.id === newRecord.id);
                if (index !== -1) {
                    this.users[index] = newRecord;
                }
                await this.logActivity('User Updated', `User ${newRecord.email} updated`);
                break;
            case 'DELETE':
                this.users = this.users.filter(u => u.id !== oldRecord.id);
                await this.logActivity('User Deleted', `User ${oldRecord.email} deleted`);
                break;
        }

        // Update dashboard stats if on dashboard page
        if (this.currentPage === 'dashboard') {
            this.updateDashboardStats();
        }

        // Update user table if on users page
        if (this.currentPage === 'users') {
            this.filterUsers();
        }

        showToast(`User ${eventType.toLowerCase()}d`, 'info');
    },

    // Handle transaction changes
    async handleTransactionChange(payload) {
        const { eventType, new: newRecord } = payload;

        if (eventType === 'INSERT') {
            await this.logActivity('New Transaction', `Transaction of ${newRecord.amount} by ${newRecord.user_id}`);

            // Update dashboard stats
            if (this.currentPage === 'dashboard') {
                this.updateDashboardStats();
            }
        }

        showToast(`Transaction ${eventType.toLowerCase()}d`, 'info');
    },

    // Handle withdrawal changes
    async handleWithdrawalChange(payload) {
        const { eventType, new: newRecord } = payload;

        if (eventType === 'INSERT') {
            await this.logActivity('New Withdrawal Request', `Withdrawal request of ${newRecord.amount} by ${newRecord.user_id}`);

            // Update dashboard stats
            if (this.currentPage === 'dashboard') {
                this.updateDashboardStats();
            }
        }

        showToast(`Withdrawal ${eventType.toLowerCase()}d`, 'info');
    },

    // Handle trade changes
    async handleTradeChange(payload) {
        const { eventType, new: newRecord } = payload;

        if (eventType === 'INSERT') {
            await this.logActivity('New Trade', `Trade ${newRecord.type} of ${newRecord.amount} by ${newRecord.user_id}`);

            // Update dashboard stats
            if (this.currentPage === 'dashboard') {
                this.updateDashboardStats();
            }
        }

        showToast(`Trade ${eventType.toLowerCase()}d`, 'info');
    },

    // Handle notification changes
    async handleNotificationChange(payload) {
        const { eventType, new: newRecord } = payload;

        if (eventType === 'INSERT') {
            await this.logActivity('New Notification', `Notification sent to ${newRecord.user_id}`);

            // Show notification to admin
            showToast('New notification sent', 'info');
        }
    },

    // Update dashboard statistics in real-time
    async updateDashboardStats() {
        try {
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
                document.getElementById('total-deposits').textContent = `${totalDeposits.toFixed(2)}`;
            }

            if (withdrawalsResult.data) {
                document.getElementById('pending-withdrawals').textContent = withdrawalsResult.data.length;
            }
        } catch (error) {
            console.error('Error updating dashboard stats:', error);
        }
    },

    // Admin control methods
    async approveDeposit(transactionId) {
        try {
            // Get transaction details
            const { data: transaction, error: fetchError } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', transactionId)
                .single();

            if (fetchError) throw fetchError;

            // Update transaction status
            const { error: updateError } = await supabase
                .from('transactions')
                .update({
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', transactionId);

            if (updateError) throw updateError;

            // Update user balance
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({
                    balance: supabase.sql`balance + ${transaction.amount}`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', transaction.user_id);

            if (balanceError) throw balanceError;

            // Log activity
            await this.logActivity('Deposit Approved', `Approved deposit of ${transaction.amount} for user ${transaction.user_id}`);

            showToast('Deposit approved successfully', 'success');

            // Refresh data
            this.updateDashboardStats();
        } catch (error) {
            console.error('Error approving deposit:', error);
            showToast('Error approving deposit', 'error');
        }
    },

    async rejectDeposit(transactionId) {
        try {
            const { error } = await supabase
                .from('transactions')
                .update({
                    status: 'rejected',
                    updated_at: new Date().toISOString()
                })
                .eq('id', transactionId);

            if (error) throw error;

            // Log activity
            await this.logActivity('Deposit Rejected', `Rejected deposit ${transactionId}`);

            showToast('Deposit rejected', 'success');
        } catch (error) {
            console.error('Error rejecting deposit:', error);
            showToast('Error rejecting deposit', 'error');
        }
    },

    async approveWithdrawal(withdrawalId) {
        try {
            // Get withdrawal details
            const { data: withdrawal, error: fetchError } = await supabase
                .from('withdrawals')
                .select('*')
                .eq('id', withdrawalId)
                .single();

            if (fetchError) throw fetchError;

            // Check if user has sufficient balance
            const { data: user, error: userError } = await supabase
                .from('profiles')
                .select('balance')
                .eq('id', withdrawal.user_id)
                .single();

            if (userError) throw userError;

            if (user.balance < withdrawal.amount) {
                throw new Error('Insufficient user balance');
            }

            // Update withdrawal status
            const { error: updateError } = await supabase
                .from('withdrawals')
                .update({
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', withdrawalId);

            if (updateError) throw updateError;

            // Deduct from user balance
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({
                    balance: supabase.sql`balance - ${withdrawal.amount}`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', withdrawal.user_id);

            if (balanceError) throw balanceError;

            // Log activity
            await this.logActivity('Withdrawal Approved', `Approved withdrawal of ${withdrawal.amount} for user ${withdrawal.user_id}`);

            showToast('Withdrawal approved successfully', 'success');

            // Refresh data
            this.updateDashboardStats();
        } catch (error) {
            console.error('Error approving withdrawal:', error);
            showToast(`Error approving withdrawal: ${error.message}`, 'error');
        }
    },

    async rejectWithdrawal(withdrawalId) {
        try {
            const { error } = await supabase
                .from('withdrawals')
                .update({
                    status: 'rejected',
                    updated_at: new Date().toISOString()
                })
                .eq('id', withdrawalId);

            if (error) throw error;

            // Log activity
            await this.logActivity('Withdrawal Rejected', `Rejected withdrawal ${withdrawalId}`);

            showToast('Withdrawal rejected', 'success');
        } catch (error) {
            console.error('Error rejecting withdrawal:', error);
            showToast('Error rejecting withdrawal', 'error');
        }
    },

    async setTradeOutcome(tradeId, outcome, profitLoss) {
        try {
            // Get trade details
            const { data: trade, error: fetchError } = await supabase
                .from('trades')
                .select('*')
                .eq('id', tradeId)
                .single();

            if (fetchError) throw fetchError;

            // Update trade outcome
            const { error: updateError } = await supabase
                .from('trades')
                .update({
                    status: outcome,
                    profit_loss: profitLoss,
                    closed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', tradeId);

            if (updateError) throw updateError;

            // Update user balance based on outcome
            const balanceChange = outcome === 'profit' ? profitLoss : -Math.abs(profitLoss);

            const { error: balanceError } = await supabase
                .from('profiles')
                .update({
                    balance: supabase.sql`balance + ${balanceChange}`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', trade.user_id);

            if (balanceError) throw balanceError;

            // Log activity
            await this.logActivity('Trade Outcome Set', `Set trade ${tradeId} outcome to ${outcome} with ${balanceChange > 0 ? 'profit' : 'loss'} of ${Math.abs(balanceChange)}`);

            showToast('Trade outcome set successfully', 'success');
        } catch (error) {
            console.error('Error setting trade outcome:', error);
            showToast('Error setting trade outcome', 'error');
        }
    },

    async sendNotification(userId, title, message, type = 'info') {
        try {
            const { error } = await supabase
                .from('notifications')
                .insert({
                    user_id: userId,
                    title: title,
                    message: message,
                    type: type,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            // Log activity
            await this.logActivity('Notification Sent', `Sent ${type} notification to user ${userId}`);

            showToast('Notification sent successfully', 'success');
        } catch (error) {
            console.error('Error sending notification:', error);
            showToast('Error sending notification', 'error');
        }
    },

    async resetUserHistory(userId) {
        if (!confirm('Are you sure you want to reset this user\'s history? This action cannot be undone.')) return;

        try {
            // Reset user balance
            const { error: balanceError } = await supabase
                .from('profiles')
                .update({
                    balance: 0,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (balanceError) throw balanceError;

            // Delete user transactions
            const { error: transactionError } = await supabase
                .from('transactions')
                .delete()
                .eq('user_id', userId);

            if (transactionError) throw transactionError;

            // Delete user trades
            const { error: tradeError } = await supabase
                .from('trades')
                .delete()
                .eq('user_id', userId);

            if (tradeError) throw tradeError;

            // Delete user withdrawals
            const { error: withdrawalError } = await supabase
                .from('withdrawals')
                .delete()
                .eq('user_id', userId);

            if (withdrawalError) throw withdrawalError;

            // Log activity
            await this.logActivity('User History Reset', `Reset history for user ${userId}`);

            showToast('User history reset successfully', 'success');
        } catch (error) {
            console.error('Error resetting user history:', error);
            showToast('Error resetting user history', 'error');
        }
    },

    // Cleanup real-time listeners
    cleanupListeners() {
        Object.values(this.realTimeListeners).forEach(listener => {
            if (listener) {
                supabase.removeChannel(listener);
            }
        });
        this.realTimeListeners = {};
    },

    // Transaction management methods
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

            // Create modal content
            const modalContent = `
                <div class="transaction-details">
                    <h3>Transaction Details</h3>
                    <div class="detail-row">
                        <span class="label">User:</span>
                        <span class="value">${transaction.profiles?.full_name || transaction.profiles?.email || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Type:</span>
                        <span class="value status ${transaction.type}">${transaction.type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Amount:</span>
                        <span class="value">${transaction.amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Status:</span>
                        <span class="value status ${transaction.status || 'pending'}">${transaction.status || 'pending'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Date:</span>
                        <span class="value">${this.formatDate(transaction.created_at)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Transaction ID:</span>
                        <span class="value">${transaction.id}</span>
                    </div>
                    ${transaction.description ? `
                        <div class="detail-row">
                            <span class="label">Description:</span>
                            <span class="value">${transaction.description}</span>
                        </div>
                    ` : ''}
                </div>
            `;

            // Create modal if it doesn't exist
            if (!document.getElementById('transaction-modal')) {
                const modalHTML = `
                    <div id="transaction-modal" class="modal" style="display: none;">
                        <div class="modal-content">
                            <span class="close" onclick="closeModal('transaction-modal')">&times;</span>
                            ${modalContent}
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            } else {
                document.querySelector('#transaction-modal .modal-content').innerHTML = `
                    <span class="close" onclick="closeModal('transaction-modal')">&times;</span>
                    ${modalContent}
                `;
            }

            openModal('transaction-modal');
        } catch (error) {
            console.error('Error viewing transaction:', error);
            showToast('Error loading transaction details', 'error');
        }
    },

    async approveTransaction(transactionId) {
        if (!confirm('Are you sure you want to approve this transaction?')) return;

        try {
            // Get transaction details
            const { data: transaction, error: fetchError } = await supabase
                .from('transactions')
                .select('*')
                .eq('id', transactionId)
                .single();

            if (fetchError) throw fetchError;

            // Update transaction status
            const { error: updateError } = await supabase
                .from('transactions')
                .update({
                    status: 'completed',
                    updated_at: new Date().toISOString()
                })
                .eq('id', transactionId);

            if (updateError) throw updateError;

            // Update user balance if it's a deposit
            if (transaction.type === 'deposit') {
                const { error: balanceError } = await supabase
                    .from('profiles')
                    .update({
                        balance: supabase.sql`balance + ${transaction.amount}`,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', transaction.user_id);

                if (balanceError) throw balanceError;
            }

            // Log activity
            await this.logActivity('Transaction Approved', `Approved ${transaction.type} of ${transaction.amount} for user ${transaction.user_id}`);

            showToast('Transaction approved successfully', 'success');

            // Refresh data
            if (this.currentPage === 'transactions') {
                this.loadTransactions();
            }
            if (this.currentPage === 'dashboard') {
                this.updateDashboardStats();
            }
        } catch (error) {
            console.error('Error approving transaction:', error);
            showToast('Error approving transaction', 'error');
        }
    },

    async rejectTransaction(transactionId) {
        if (!confirm('Are you sure you want to reject this transaction?')) return;

        try {
            const { error } = await supabase
                .from('transactions')
                .update({
                    status: 'rejected',
                    updated_at: new Date().toISOString()
                })
                .eq('id', transactionId);

            if (error) throw error;

            // Log activity
            await this.logActivity('Transaction Rejected', `Rejected transaction ${transactionId}`);

            showToast('Transaction rejected', 'success');

            // Refresh data
            if (this.currentPage === 'transactions') {
                this.loadTransactions();
            }
        } catch (error) {
            console.error('Error rejecting transaction:', error);
            showToast('Error rejecting transaction', 'error');
        }
    },

    // Withdrawal management methods
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

            // Create modal content
            const modalContent = `
                <div class="withdrawal-details">
                    <h3>Withdrawal Details</h3>
                    <div class="detail-row">
                        <span class="label">User:</span>
                        <span class="value">${withdrawal.profiles?.full_name || withdrawal.profiles?.email || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Amount:</span>
                        <span class="value">${withdrawal.amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Method:</span>
                        <span class="value status ${withdrawal.method || 'bank'}">${withdrawal.method || 'bank'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Status:</span>
                        <span class="value status ${withdrawal.status || 'pending'}">${withdrawal.status || 'pending'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Date:</span>
                        <span class="value">${this.formatDate(withdrawal.created_at)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Withdrawal ID:</span>
                        <span class="value">${withdrawal.id}</span>
                    </div>
                    ${withdrawal.details ? `
                        <div class="detail-row">
                            <span class="label">Details:</span>
                            <span class="value">${withdrawal.details}</span>
                        </div>
                    ` : ''}
                </div>
            `;

            // Create modal if it doesn't exist
            if (!document.getElementById('withdrawal-modal')) {
                const modalHTML = `
                    <div id="withdrawal-modal" class="modal" style="display: none;">
                        <div class="modal-content">
                            <span class="close" onclick="closeModal('withdrawal-modal')">&times;</span>
                            ${modalContent}
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            } else {
                document.querySelector('#withdrawal-modal .modal-content').innerHTML = `
                    <span class="close" onclick="closeModal('withdrawal-modal')">&times;</span>
                    ${modalContent}
                `;
            }

            openModal('withdrawal-modal');
        } catch (error) {
            console.error('Error viewing withdrawal:', error);
            showToast('Error loading withdrawal details', 'error');
        }
    },

    // Trade management methods
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

            // Create modal content
            const modalContent = `
                <div class="trade-details">
                    <h3>Trade Details</h3>
                    <div class="detail-row">
                        <span class="label">User:</span>
                        <span class="value">${trade.profiles?.full_name || trade.profiles?.email || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Type:</span>
                        <span class="value status ${trade.type}">${trade.type}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Amount:</span>
                        <span class="value">${trade.amount?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Profit/Loss:</span>
                        <span class="value status ${trade.profit_loss >= 0 ? 'profit' : 'loss'}">${trade.profit_loss?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Status:</span>
                        <span class="value status ${trade.status}">${trade.status}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Opened:</span>
                        <span class="value">${this.formatDate(trade.created_at)}</span>
                    </div>
                    ${trade.closed_at ? `
                        <div class="detail-row">
                            <span class="label">Closed:</span>
                            <span class="value">${this.formatDate(trade.closed_at)}</span>
                        </div>
                    ` : ''}
                    <div class="detail-row">
                        <span class="label">Trade ID:</span>
                        <span class="value">${trade.id}</span>
                    </div>
                </div>
            `;

            // Create modal if it doesn't exist
            if (!document.getElementById('trade-modal')) {
                const modalHTML = `
                    <div id="trade-modal" class="modal" style="display: none;">
                        <div class="modal-content">
                            <span class="close" onclick="closeModal('trade-modal')">&times;</span>
                            ${modalContent}
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', modalHTML);
            } else {
                document.querySelector('#trade-modal .modal-content').innerHTML = `
                    <span class="close" onclick="closeModal('trade-modal')">&times;</span>
                    ${modalContent}
                `;
            }

            openModal('trade-modal');
        } catch (error) {
            console.error('Error viewing trade:', error);
            showToast('Error loading trade details', 'error');
        }
    },

    async closeTrade(tradeId, outcome) {
        const profitLoss = prompt(`Enter ${outcome === 'profit' ? 'profit' : 'loss'} amount:`);
        if (profitLoss === null) return;

        const amount = parseFloat(profitLoss);
        if (isNaN(amount)) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        try {
            // Get trade details
            const { data: trade, error: fetchError } = await supabase
                .from('trades')
                .select('*')
                .eq('id', tradeId)
                .single();

            if (fetchError) throw fetchError;

            // Update trade outcome
            const { error: updateError } = await supabase
                .from('trades')
                .update({
                    status: 'closed',
                    profit_loss: outcome === 'profit' ? amount : -Math.abs(amount),
                    closed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', tradeId);

            if (updateError) throw updateError;

            // Update user balance based on outcome
            const balanceChange = outcome === 'profit' ? amount : -Math.abs(amount);

            const { error: balanceError } = await supabase
                .from('profiles')
                .update({
                    balance: supabase.sql`balance + ${balanceChange}`,
                    updated_at: new Date().toISOString()
                })
                .eq('id', trade.user_id);

            if (balanceError) throw balanceError;

            // Create transaction record for the trade outcome
            const transactionType = outcome === 'profit' ? 'deposit' : 'withdrawal';
            const transactionDescription = `Trade ${tradeId} outcome: ${outcome === 'profit' ? 'Profit' : 'Loss'} of $${Math.abs(amount).toFixed(2)}`;

            await supabase
                .from('transactions')
                .insert({
                    user_id: trade.user_id,
                    type: transactionType,
                    amount: Math.abs(amount),
                    status: 'completed',
                    description: transactionDescription,
                    created_at: new Date().toISOString()
                });

            // Log activity
            await this.logActivity('Trade Closed', `Closed trade ${tradeId} with ${outcome} of ${Math.abs(amount)}`);

            showToast('Trade closed successfully', 'success');

            // Refresh data
            if (this.currentPage === 'trades') {
                this.loadTrades();
            }
            if (this.currentPage === 'dashboard') {
                this.updateDashboardStats();
            }
        } catch (error) {
            console.error('Error closing trade:', error);
            showToast('Error closing trade', 'error');
        }
    },

    // Export methods
    exportTransactions() {
        showToast('Transaction export functionality coming soon', 'info');
    },

    exportWithdrawals() {
        showToast('Withdrawal export functionality coming soon', 'info');
    },

    exportTrades() {
        showToast('Trade export functionality coming soon', 'info');
    },

    exportLogs() {
        showToast('Log export functionality coming soon', 'info');
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