// Admin dashboard functionality

class AdminDashboard {
  constructor() {
    this.currentUser = null;
    this.users = [];
    this.withdrawals = [];
    this.trades = [];
    this.notifications = [];
    this.usersChart = null;
    this.volumeChart = null;
    this.currentWithdrawal = null;
    this.currentEditUser = null;
    
    this.init();
  }
  
  async init() {
    // Check authentication and admin role
    if (!SessionManager.isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }
    
    const session = SessionManager.getSession();
    const user = state.getUserById(session.userId);
    
    if (!user || user.role !== 'admin') {
      showToast('Access denied. Admin privileges required.', 'error');
      window.location.href = 'dashboard.html';
      return;
    }
    
    // Load user data
    this.loadUserData();
    
    // Setup UI
    this.setupNavigation();
    this.setupCharts();
    this.setupEventListeners();
    this.setupTables();
    
    // Load initial data
    await this.loadAdminData();
    
    // Start real-time updates
    this.startRealTimeUpdates();
  }
  
  loadUserData() {
    try {
      const session = SessionManager.getSession();
      if (session) {
        this.currentUser = state.getUserById(session.userId);
      }
      if (this.currentUser) {
        this.updateUserInterface();
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      showToast('Failed to load user data', 'error');
    }
  }
  
  updateUserInterface() {
    if (!this.currentUser) return;
    
    // Update user info in sidebar
    const userNameEl = document.getElementById('sidebar-user-name');
    if (userNameEl) userNameEl.textContent = this.currentUser.fullName;
  }
  
  setupNavigation() {
    // Sidebar navigation
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.getAttribute('data-page');
        if (page) {
          showPage(page);
          this.onPageChange(page);
        }
      });
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuToggle && sidebar) {
      mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }
    
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }
    
    // User menu
    const userMenu = document.getElementById('user-menu');
    const userMenuDropdown = document.getElementById('user-menu-dropdown');
    
    if (userMenu && userMenuDropdown) {
      userMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        userMenu.classList.toggle('active');
      });
      
      document.addEventListener('click', () => {
        userMenu.classList.remove('active');
      });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.confirmLogout();
      });
    }
  }
  
  setupCharts() {
    // Users growth chart
    const usersCanvas = document.getElementById('users-chart');
    if (usersCanvas) {
      const data = this.generateUsersGrowthData();
      this.usersChart = createBarChart(usersCanvas, data.values, data.labels, {
        dataset: {
          backgroundColor: 'rgba(33, 150, 243, 0.8)',
          borderColor: '#2196f3'
        }
      });
    }
    
    // Trading volume chart
    const volumeCanvas = document.getElementById('volume-chart');
    if (volumeCanvas) {
      const data = this.generateVolumeData();
      this.volumeChart = createBarChart(volumeCanvas, data.values, data.labels, {
        dataset: {
          backgroundColor: 'rgba(76, 175, 80, 0.8)',
          borderColor: '#4caf50'
        }
      });
    }
    
    // Chart timeframe controls
    const chartTimeframes = document.querySelectorAll('.chart-timeframe');
    chartTimeframes.forEach(btn => {
      btn.addEventListener('click', () => {
        const chart = btn.getAttribute('data-chart');
        const timeframe = btn.getAttribute('data-timeframe');
        this.updateChart(chart, timeframe);
        
        // Update active state
        const siblings = btn.parentElement.querySelectorAll('.chart-timeframe');
        siblings.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }
  
  setupEventListeners() {
    // Create user form
    const createUserForm = document.getElementById('create-user-form');
    if (createUserForm) {
      createUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createUser();
      });
    }
    
    // Edit user form
    const editUserForm = document.getElementById('edit-user-form');
    if (editUserForm) {
      editUserForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.updateUser();
      });
    }
    
    // Broadcast form
    const broadcastForm = document.getElementById('broadcast-form');
    if (broadcastForm) {
      broadcastForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendBroadcast();
      });
    }
    
    // Recipients selector
    const recipientsSelect = document.getElementById('broadcast-recipients');
    if (recipientsSelect) {
      recipientsSelect.addEventListener('change', () => {
        const userSelector = document.getElementById('user-selector');
        if (userSelector) {
          userSelector.style.display = 
            recipientsSelect.value === 'select' ? 'block' : 'none';
        }
      });
    }
    
    // Search inputs
    const searchInputs = document.querySelectorAll('[id$="-search"]');
    searchInputs.forEach(input => {
      input.addEventListener('input', debounce(() => {
        const type = input.id.replace('-search', '');
        this.searchData(type, input.value);
      }, 300));
    });
    
    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        const type = this.getCurrentPageType();
        this.filterData(type, filter);
        
        // Update active state
        const siblings = btn.parentElement.querySelectorAll('.filter-btn');
        siblings.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }
  
  setupTables() {
    // Make table headers sortable
    const sortableHeaders = document.querySelectorAll('th.sortable');
    sortableHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const sortKey = header.getAttribute('data-sort');
        const table = header.closest('table');
        const type = table.id.replace('-table', '');
        this.sortData(type, sortKey);
      });
    });
  }
  
  loadAdminData() {
    try {
      // Load all users
      this.users = state.getUsers().filter(u => u.role !== 'admin'); // Don't show admin users
      this.renderUsers();
      this.updateKPIs();
      
      // Load withdrawals
      this.withdrawals = state.getWithdrawals()
        .sort((a, b) => b.createdAt - a.createdAt);
      this.renderWithdrawals();
      this.updateWithdrawalBadge();
      
      // Load all trades
      this.trades = state.getTrades()
        .sort((a, b) => b.openedAt - a.openedAt);
      this.renderTrades();
      
      // Load sent notifications
      this.notifications = state.getNotifications()
        .filter(n => !n.toUserId) // Broadcast notifications
        .sort((a, b) => b.createdAt - a.createdAt);
      this.renderSentNotifications();
      
      // Render admin activity
      this.renderAdminActivity();
      
    } catch (error) {
      console.error('Failed to load admin data:', error);
      showToast('Failed to load admin data', 'error');
    }
  }
  
  updateKPIs() {
    const totalUsersEl = document.getElementById('total-users');
    const totalBalanceEl = document.getElementById('total-balance');
    const openTradesEl = document.getElementById('open-trades');
    const pendingWithdrawalsEl = document.getElementById('pending-withdrawals');
    
    if (totalUsersEl) {
      totalUsersEl.textContent = this.users.length.toLocaleString();
    }
    
    if (totalBalanceEl) {
      const totalBalance = this.users.reduce((sum, user) => {
        return sum + (user.balances?.USD || 0);
      }, 0);
      totalBalanceEl.textContent = formatCurrency(totalBalance, 'USD', 0);
    }
    
    if (openTradesEl) {
      const openTrades = this.trades.filter(t => t.status === 'open').length;
      openTradesEl.textContent = openTrades.toLocaleString();
    }
    
    if (pendingWithdrawalsEl) {
      const pendingWithdrawals = this.withdrawals.filter(w => w.status === 'pending').length;
      pendingWithdrawalsEl.textContent = pendingWithdrawals.toLocaleString();
    }
  }
  
  updateWithdrawalBadge() {
    const pendingCount = this.withdrawals.filter(w => w.status === 'pending').length;
    const badge = document.getElementById('withdrawal-badge');
    
    if (badge) {
      if (pendingCount > 0) {
        badge.textContent = pendingCount;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }
  }
  
  renderUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    
    if (this.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center">No users found</td></tr>';
      return;
    }
    
    tbody.innerHTML = this.users.map(user => `
      <tr>
        <td>
          <div class="user-cell">
            <img src="https://images.pexels.com/photos/3777946/pexels-photo-3777946.jpeg?w=32&h=32&fit=crop&crop=face" alt="${user.fullName}">
            <div class="user-details">
              <span class="user-name">${user.fullName}</span>
              <span class="user-email">${user.email}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="role-badge ${user.role}">${user.role}</span>
        </td>
        <td class="balance-display">${formatCurrency(user.balances?.USD || 0)}</td>
        <td class="balance-display">${(user.balances?.BTC || 0).toFixed(8)}</td>
        <td class="balance-display">${(user.balances?.ETH || 0).toFixed(6)}</td>
        <td>
          <span class="verification-badge ${user.emailVerified ? 'verified' : 'unverified'}">
            <i class="fas fa-${user.emailVerified ? 'check-circle' : 'times-circle'}"></i>
            ${user.emailVerified ? 'Verified' : 'Unverified'}
          </span>
        </td>
        <td>${formatDateTime(user.createdAt)}</td>
        <td>${user.lastLoginAt ? getRelativeTime(user.lastLoginAt) : 'Never'}</td>
        <td>
          <div class="action-buttons">
            <button class="action-btn" onclick="admin.editUser('${user._id}')">
              Edit
            </button>
            <button class="action-btn danger" onclick="admin.deleteUser('${user._id}')">
              Delete
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }
  
  renderWithdrawals() {
    const tbody = document.getElementById('withdrawals-tbody');
    if (!tbody) return;
    
    if (this.withdrawals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No withdrawals found</td></tr>';
      return;
    }
    
    tbody.innerHTML = this.withdrawals.map(withdrawal => {
      const user = this.users.find(u => u._id === withdrawal.userId);
      
      return `
        <tr>
          <td>${formatDateTime(withdrawal.createdAt)}</td>
          <td>${user ? user.fullName : 'Unknown User'}</td>
          <td>${formatCurrency(withdrawal.amount)}</td>
          <td>${withdrawal.currency}</td>
          <td class="text-capitalize">${withdrawal.method}</td>
          <td>
            <span class="status-badge ${withdrawal.status}">${withdrawal.status}</span>
          </td>
          <td>
            <div class="action-buttons">
              ${withdrawal.status === 'pending' ? `
                <button class="action-btn" onclick="admin.reviewWithdrawal('${withdrawal._id}')">
                  Review
                </button>
              ` : ''}
              ${withdrawal.status === 'approved' ? `
                <button class="action-btn" onclick="admin.markWithdrawalPaid('${withdrawal._id}')">
                  Mark Paid
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
  
  renderTrades() {
    const tbody = document.getElementById('trades-tbody');
    if (!tbody) return;
    
    if (this.trades.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center">No trades found</td></tr>';
      return;
    }
    
    tbody.innerHTML = this.trades.map(trade => {
      const user = this.users.find(u => u._id === trade.userId);
      const currentPrice = priceEngine.getCurrentPrice(trade.symbol);
      const displayPrice = trade.status === 'closed' ? trade.closePrice : currentPrice;
      const pnl = trade.pnl || this.calculatePnL(trade, currentPrice);
      const pnlClass = pnl >= 0 ? 'positive' : 'negative';
      
      return `
        <tr>
          <td>${formatDateTime(trade.openedAt)}</td>
          <td>${user ? user.fullName : 'Unknown User'}</td>
          <td>${trade.symbol}</td>
          <td>
            <span class="text-capitalize ${trade.side === 'buy' ? 'text-success' : 'text-error'}">
              ${trade.side}
            </span>
          </td>
          <td>${trade.qty}</td>
          <td>$${trade.entryPrice.toFixed(2)}</td>
          <td>$${displayPrice.toFixed(2)}</td>
          <td class="pnl ${pnlClass}">$${Math.abs(pnl).toFixed(2)}</td>
          <td>
            <span class="status-badge ${trade.status}">${trade.status}</span>
          </td>
          <td>
            <div class="action-buttons">
              ${trade.status === 'open' ? `
                <button class="action-btn" onclick="admin.forceCloseTrade('${trade._id}')">
                  Force Close
                </button>
              ` : ''}
              <button class="action-btn danger" onclick="admin.deleteTrade('${trade._id}')">
                Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
  
  renderSentNotifications() {
    const container = document.getElementById('sent-notifications-list');
    if (!container) return;
    
    if (this.notifications.length === 0) {
      container.innerHTML = '<p class="text-center text-tertiary">No broadcast notifications sent</p>';
      return;
    }
    
    container.innerHTML = this.notifications.map(notification => `
      <div class="sent-item">
        <div class="sent-header-row">
          <h4 class="sent-title">${notification.title}</h4>
          <span class="sent-time">${getRelativeTime(notification.createdAt)}</span>
        </div>
        <div class="sent-recipients">Broadcast to all users</div>
        <p class="sent-message">${notification.body}</p>
      </div>
    `).join('');
  }
  
  renderAdminActivity() {
    const container = document.getElementById('admin-activity-list');
    if (!container) return;
    
    // Generate sample admin activity
    const activities = [
      {
        type: 'user',
        title: 'New user registered',
        subtitle: 'sarah.chen@email.com',
        time: Date.now() - (2 * 60 * 60 * 1000)
      },
      {
        type: 'withdrawal',
        title: 'Withdrawal approved',
        subtitle: '$1,000.00 to marcus@email.com',
        time: Date.now() - (4 * 60 * 60 * 1000)
      },
      {
        type: 'trade',
        title: 'Large trade executed',
        subtitle: 'BUY 5.0 BTC at $42,850',
        time: Date.now() - (6 * 60 * 60 * 1000)
      },
      {
        type: 'system',
        title: 'System maintenance completed',
        subtitle: 'All services restored',
        time: Date.now() - (12 * 60 * 60 * 1000)
      }
    ];
    
    container.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-icon ${activity.type}">
          <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
        </div>
        <div class="activity-details">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-subtitle">${activity.subtitle}</div>
        </div>
        <div class="activity-time">
          ${getRelativeTime(activity.time)}
        </div>
      </div>
    `).join('');
  }
  
  startRealTimeUpdates() {
    // Update KPIs periodically
    setInterval(() => {
      this.updateKPIs();
    }, 30000); // Every 30 seconds
    
    // Update online users count (simulated)
    const onlineUsersEl = document.getElementById('online-users');
    if (onlineUsersEl) {
      setInterval(() => {
        const count = Math.floor(Math.random() * 50) + 300;
        onlineUsersEl.textContent = count;
      }, 10000); // Every 10 seconds
    }
  }
  
  generateUsersGrowthData() {
    const labels = [];
    const values = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      values.push(Math.floor(Math.random() * 100) + 50);
    }
    
    return { labels, values };
  }
  
  generateVolumeData() {
    const labels = [];
    const values = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      values.push(Math.floor(Math.random() * 50) + 20);
    }
    
    return { labels, values };
  }
  
  updateChart(chartType, timeframe) {
    // Update chart data based on timeframe
    let chart, dataGenerator;
    
    if (chartType === 'users') {
      chart = this.usersChart;
      dataGenerator = () => this.generateUsersGrowthData();
    } else if (chartType === 'volume') {
      chart = this.volumeChart;
      dataGenerator = () => this.generateVolumeData();
    }
    
    if (chart && dataGenerator) {
      const newData = dataGenerator();
      chart.data.labels = newData.labels;
      chart.data.datasets[0].data = newData.values;
      chart.update();
    }
  }
  
  async createUser() {
    const nameInput = document.getElementById('new-user-name');
    const emailInput = document.getElementById('new-user-email');
    const roleSelect = document.getElementById('new-user-role');
    const passwordInput = document.getElementById('new-user-password');
    
    if (!nameInput || !emailInput || !roleSelect || !passwordInput) return;
    
    const userData = {
      fullName: nameInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
      role: roleSelect.value,
      emailVerified: true // Admin-created users are auto-verified
    };
    
    // Validation
    if (!userData.fullName || !userData.email) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    // Check if email already exists
    const existingUser = state.getUserByEmail(userData.email);
    if (existingUser) {
      showToast('Email already exists', 'error');
      return;
    }
    
    try {
      const newUser = state.createUser(userData);
      
      // Mark as verified since admin created
      state.updateUser(newUser._id, { emailVerified: true });
      
      showToast('User created successfully', 'success');
      closeModal('create-user-modal');
      
      // Reset form
      nameInput.value = '';
      emailInput.value = '';
      roleSelect.selectedIndex = 0;
      passwordInput.value = '';
      
      // Refresh data
      this.loadAdminData();
    } catch (error) {
      console.error('Create user error:', error);
      showToast('Failed to create user', 'error');
    }
  }
  
  async editUser(userId) {
    const user = this.users.find(u => u._id === userId);
    if (!user) return;
    
    this.currentEditUser = user;
    
    // Populate form
    const nameInput = document.getElementById('edit-user-name');
    const emailInput = document.getElementById('edit-user-email');
    const roleSelect = document.getElementById('edit-user-role');
    const userIdInput = document.getElementById('edit-user-id');
    const usdInput = document.getElementById('edit-user-usd');
    const btcInput = document.getElementById('edit-user-btc');
    const ethInput = document.getElementById('edit-user-eth');
    
    if (nameInput) nameInput.value = user.fullName;
    if (emailInput) emailInput.value = user.email;
    if (roleSelect) roleSelect.value = user.role;
    if (userIdInput) userIdInput.value = user._id;
    if (usdInput) usdInput.value = user.balances?.USD || 0;
    if (btcInput) btcInput.value = user.balances?.BTC || 0;
    if (ethInput) ethInput.value = user.balances?.ETH || 0;
    
    openModal('edit-user-modal');
  }
  
  async updateUser() {
    if (!this.currentEditUser) return;
    
    const nameInput = document.getElementById('edit-user-name');
    const emailInput = document.getElementById('edit-user-email');
    const roleSelect = document.getElementById('edit-user-role');
    
    if (!nameInput || !emailInput || !roleSelect) return;
    
    const updates = {
      fullName: nameInput.value.trim(),
      email: emailInput.value.trim().toLowerCase(),
      role: roleSelect.value
    };
    
    try {
      state.updateUser(this.currentEditUser._id, updates);
      
      showToast('User updated successfully', 'success');
      closeModal('edit-user-modal');
      
      // Refresh data
      this.loadAdminData();
    } catch (error) {
      console.error('Update user error:', error);
      showToast('Failed to update user', 'error');
    }
  }
  
  async adjustBalance(currency) {
    if (!this.currentEditUser) return;
    
    const input = document.getElementById(`edit-user-${currency.toLowerCase()}`);
    if (!input) return;
    
    const newBalance = parseFloat(input.value) || 0;
    const currentBalance = this.currentEditUser.balances?.[currency] || 0;
    const difference = newBalance - currentBalance;
    
    if (difference === 0) {
      showToast('No change in balance', 'warning');
      return;
    }
    
    const reason = prompt(`Reason for ${currency} balance adjustment:`);
    if (!reason) return;
    
    try {
      // Update user balance directly
      const updatedBalances = { ...this.currentEditUser.balances };
      updatedBalances[currency] = newBalance;
      
      state.updateUser(this.currentEditUser._id, { balances: updatedBalances });
      
      // Create transaction record
      const transactionData = {
        _id: state.generateId(),
        userId: this.currentEditUser._id,
        type: difference > 0 ? 'bonus' : 'fee',
        amount: Math.abs(difference),
        currency: currency,
        status: 'completed',
        note: `Admin adjustment: ${reason}`,
        createdAt: Date.now(),
        meta: { adminId: this.currentUser._id, reason }
      };
      
      state.addTransaction(transactionData);
      
      showToast(`${currency} balance adjusted successfully`, 'success');
      
      // Update local data
      this.currentEditUser.balances[currency] = newBalance;
      
      // Refresh data
      this.loadAdminData();
    } catch (error) {
      console.error('Adjust balance error:', error);
      showToast('Failed to adjust balance', 'error');
    }
  }
  
  async deleteUser(userId) {
    const user = this.users.find(u => u._id === userId);
    if (!user) return;
    
    if (!confirm(`Are you sure you want to delete user "${user.fullName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      state.deleteUser(userId);
      
      showToast('User deleted successfully', 'success');
      
      // Refresh data
      this.loadAdminData();
    } catch (error) {
      console.error('Delete user error:', error);
      showToast('Failed to delete user', 'error');
    }
  }
  
  async reviewWithdrawal(withdrawalId) {
    const withdrawal = this.withdrawals.find(w => w._id === withdrawalId);
    if (!withdrawal) return;
    
    this.currentWithdrawal = withdrawal;
    
    const user = this.users.find(u => u._id === withdrawal.userId);
    
    // Populate withdrawal details
    const detailsContainer = document.getElementById('withdrawal-details');
    if (detailsContainer) {
      detailsContainer.innerHTML = `
        <h4>Withdrawal Request Details</h4>
        <div class="detail-row">
          <span class="detail-label">User:</span>
          <span class="detail-value">${user ? user.fullName : 'Unknown User'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount:</span>
          <span class="detail-value">${formatCurrency(withdrawal.amount)} ${withdrawal.currency}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Method:</span>
          <span class="detail-value text-capitalize">${withdrawal.method}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Destination:</span>
          <span class="detail-value">${withdrawal.addressOrAccount}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Requested:</span>
          <span class="detail-value">${formatDateTime(withdrawal.createdAt)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">
            <span class="status-badge ${withdrawal.status}">${withdrawal.status}</span>
          </span>
        </div>
      `;
    }
    
    openModal('withdrawal-modal');
  }
  
  async processWithdrawal(action) {
    if (!this.currentWithdrawal) return;
    
    const adminNote = document.getElementById('admin-note')?.value || '';
    
    let newStatus;
    let message;
    
    switch (action) {
      case 'approve':
        newStatus = 'approved';
        message = 'Withdrawal approved successfully';
        break;
      case 'deny':
        newStatus = 'denied';
        message = 'Withdrawal denied';
        break;
      case 'paid':
        newStatus = 'paid';
        message = 'Withdrawal marked as paid';
        break;
      default:
        return;
    }
    
    try {
      const updates = {
        status: newStatus,
        adminNote: adminNote,
        approvedBy: this.currentUser._id,
        updatedAt: Date.now()
      };
      
      state.updateWithdrawal(this.currentWithdrawal._id, updates);
      
      showToast(message, 'success');
      closeModal('withdrawal-modal');
      
      // If denied, refund the user's balance
      if (action === 'deny') {
        const user = state.getUserById(this.currentWithdrawal.userId);
        if (user) {
          const updatedBalances = { ...user.balances };
          updatedBalances.USD = (updatedBalances.USD || 0) + this.currentWithdrawal.amount;
          
          state.updateUser(user._id, { balances: updatedBalances });
          
          // Create refund transaction
          const transactionData = {
            _id: state.generateId(),
            userId: user._id,
            type: 'deposit',
            amount: this.currentWithdrawal.amount,
            currency: 'USD',
            status: 'completed',
            note: `Withdrawal refund: ${adminNote || 'Withdrawal denied'}`,
            createdAt: Date.now(),
            meta: { withdrawalId: this.currentWithdrawal._id, adminId: this.currentUser._id }
          };
          
          state.addTransaction(transactionData);
        }
      }
      
      // Refresh data
      this.loadAdminData();
    } catch (error) {
      console.error('Process withdrawal error:', error);
      showToast('Failed to process withdrawal', 'error');
    }
  }
  
  async markWithdrawalPaid(withdrawalId) {
    this.currentWithdrawal = this.withdrawals.find(w => w._id === withdrawalId);
    if (!this.currentWithdrawal) return;
    
    await this.processWithdrawal('paid');
  }
  
  async forceCloseTrade(tradeId) {
    const trade = this.trades.find(t => t._id === tradeId);
    if (!trade) return;
    
    if (!confirm(`Are you sure you want to force close this ${trade.side} position for ${trade.symbol}?`)) {
      return;
    }
    
    try {
      const currentPrice = priceEngine.getCurrentPrice(trade.symbol);
      const pnl = this.calculatePnL(trade, currentPrice);
      
      const result = await DB.updateTrade(tradeId, {
        status: 'closed',
        closePrice: currentPrice,
        pnl: pnl
      });
      
      if (result.success) {
        // Update user balance
        const user = this.users.find(u => u._id === trade.userId);
        if (user) {
          const newBalance = (user.balances?.USD || 0) + pnl;
          await DB.updateUser(user._id, {
            'balances.USD': newBalance
          });
          
          // Create transaction
          const transactionData = {
            userId: trade.userId,
            type: 'trade',
            amount: Math.abs(pnl),
            currency: 'USD',
            status: 'completed',
            note: `Admin force closed ${trade.side.toUpperCase()} ${trade.qty} ${trade.symbol} - P&L: ${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toFixed(2)}`,
            meta: { tradeId, closePrice: currentPrice, pnl, adminId: this.currentUser._id }
          };
          
          await DB.createTransaction(transactionData);
        }
        
        showToast('Trade force closed successfully', 'success');
        
        // Refresh data
        await this.loadAdminData();
      } else {
        showToast(result.message || 'Failed to close trade', 'error');
      }
    } catch (error) {
      console.error('Force close trade error:', error);
      showToast('Failed to close trade', 'error');
    }
  }
  
  async deleteTrade(tradeId) {
    const trade = this.trades.find(t => t._id === tradeId);
    if (!trade) return;
    
    if (!confirm(`Are you sure you want to delete this trade? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const result = await DB.deleteTrade(tradeId);
      
      if (result.success) {
        showToast('Trade deleted successfully', 'success');
        
        // Refresh data
        await this.loadAdminData();
      } else {
        showToast(result.message || 'Failed to delete trade', 'error');
      }
    } catch (error) {
      console.error('Delete trade error:', error);
      showToast('Failed to delete trade', 'error');
    }
  }
  
  async sendBroadcast() {
    const recipientsSelect = document.getElementById('broadcast-recipients');
    const titleInput = document.getElementById('broadcast-title');
    const messageInput = document.getElementById('broadcast-message');
    
    if (!recipientsSelect || !titleInput || !messageInput) return;
    
    const recipients = recipientsSelect.value;
    const title = titleInput.value.trim();
    const message = messageInput.value.trim();
    
    if (!title || !message) {
      showToast('Please fill in title and message', 'error');
      return;
    }
    
    try {
      let targetUsers = [];
      
      if (recipients === 'all') {
        targetUsers = this.users;
      } else if (recipients === 'users') {
        targetUsers = this.users.filter(u => u.role === 'user');
      } else if (recipients === 'admins') {
        targetUsers = this.users.filter(u => u.role === 'admin');
      } else if (recipients === 'select') {
        // Get selected users from checkboxes
        const checkboxes = document.querySelectorAll('#user-selector input[type="checkbox"]:checked');
        const selectedIds = Array.from(checkboxes).map(cb => cb.value);
        targetUsers = this.users.filter(u => selectedIds.includes(u._id));
      }
      
      if (targetUsers.length === 0) {
        showToast('No recipients selected', 'error');
        return;
      }
      
      // Create notifications for each target user
      targetUsers.forEach(user => {
        state.addNotification({
          _id: state.generateId(),
          toUserId: user._id,
          title: title,
          body: message,
          type: 'system',
          read: false,
          createdAt: Date.now()
        });
      });
      
      // Also create a broadcast record (no toUserId)
      state.addNotification({
        _id: state.generateId(),
        title: title,
        body: message,
        type: 'system',
        read: false,
        createdAt: Date.now()
      });
      
      showToast(`Notification sent to ${targetUsers.length} user${targetUsers.length !== 1 ? 's' : ''}`, 'success');
      
      // Reset form
      titleInput.value = '';
      messageInput.value = '';
      recipientsSelect.selectedIndex = 0;
      
      // Refresh data
      this.loadAdminData();
      
    } catch (error) {
      console.error('Send broadcast error:', error);
      showToast('Failed to send notification', 'error');
    }
  }
  
  calculatePnL(trade, currentPrice) {
    const priceDiff = trade.side === 'buy' 
      ? currentPrice - trade.entryPrice 
      : trade.entryPrice - currentPrice;
    
    return priceDiff * trade.qty;
  }
  
  searchData(type, query) {
    // Implement search functionality for each data type
    switch (type) {
      case 'users':
        this.searchUsers(query);
        break;
      case 'withdrawals':
        this.searchWithdrawals(query);
        break;
      case 'trades':
        this.searchTrades(query);
        break;
    }
  }
  
  searchUsers(query) {
    if (!query.trim()) {
      this.renderUsers();
      return;
    }
    
    const filteredUsers = this.users.filter(user => 
      user.fullName.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase()) ||
      user.role.toLowerCase().includes(query.toLowerCase())
    );
    
    // Update display with filtered users
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    
    if (filteredUsers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center">No matching users found</td></tr>';
      return;
    }
    
    // Re-render with filtered data
    this.users = filteredUsers;
    this.renderUsers();
  }
  
  searchWithdrawals(query) {
    // Similar implementation for withdrawals
    if (!query.trim()) {
      this.renderWithdrawals();
      return;
    }
    
    const filteredWithdrawals = this.withdrawals.filter(withdrawal => {
      const user = this.users.find(u => u._id === withdrawal.userId);
      return (
        withdrawal.currency.toLowerCase().includes(query.toLowerCase()) ||
        withdrawal.method.toLowerCase().includes(query.toLowerCase()) ||
        withdrawal.status.toLowerCase().includes(query.toLowerCase()) ||
        (user && user.fullName.toLowerCase().includes(query.toLowerCase()))
      );
    });
    
    // Update display
    const tbody = document.getElementById('withdrawals-tbody');
    if (!tbody) return;
    
    if (filteredWithdrawals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No matching withdrawals found</td></tr>';
      return;
    }
    
    // Re-render with filtered data
    this.withdrawals = filteredWithdrawals;
    this.renderWithdrawals();
  }
  
  searchTrades(query) {
    // Similar implementation for trades
    if (!query.trim()) {
      this.renderTrades();
      return;
    }
    
    const filteredTrades = this.trades.filter(trade => {
      const user = this.users.find(u => u._id === trade.userId);
      return (
        trade.symbol.toLowerCase().includes(query.toLowerCase()) ||
        trade.side.toLowerCase().includes(query.toLowerCase()) ||
        trade.status.toLowerCase().includes(query.toLowerCase()) ||
        (user && user.fullName.toLowerCase().includes(query.toLowerCase()))
      );
    });
    
    // Update display
    const tbody = document.getElementById('trades-tbody');
    if (!tbody) return;
    
    if (filteredTrades.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center">No matching trades found</td></tr>';
      return;
    }
    
    // Re-render with filtered data
    this.trades = filteredTrades;
    this.renderTrades();
  }
  
  filterData(type, filter) {
    // Implement filter functionality
    switch (type) {
      case 'withdrawals':
        this.filterWithdrawals(filter);
        break;
      case 'trades':
        this.filterTrades(filter);
        break;
    }
  }
  
  filterWithdrawals(filter) {
    let filteredWithdrawals = [...this.withdrawals];
    
    if (filter !== 'all') {
      filteredWithdrawals = this.withdrawals.filter(w => w.status === filter);
    }
    
    // Update display
    const tbody = document.getElementById('withdrawals-tbody');
    if (!tbody) return;
    
    if (filteredWithdrawals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No withdrawals found</td></tr>';
      return;
    }
    
    // Re-render with filtered data
    const originalWithdrawals = this.withdrawals;
    this.withdrawals = filteredWithdrawals;
    this.renderWithdrawals();
    this.withdrawals = originalWithdrawals; // Restore original data
  }
  
  filterTrades(filter) {
    let filteredTrades = [...this.trades];
    
    if (filter !== 'all') {
      filteredTrades = this.trades.filter(t => t.status === filter);
    }
    
    // Update display
    const tbody = document.getElementById('trades-tbody');
    if (!tbody) return;
    
    if (filteredTrades.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center">No trades found</td></tr>';
      return;
    }
    
    // Re-render with filtered data
    const originalTrades = this.trades;
    this.trades = filteredTrades;
    this.renderTrades();
    this.trades = originalTrades; // Restore original data
  }
  
  sortData(type, sortKey) {
    // Implement sorting functionality
    switch (type) {
      case 'users':
        this.users = sortBy(this.users, sortKey);
        this.renderUsers();
        break;
      case 'withdrawals':
        this.withdrawals = sortBy(this.withdrawals, sortKey);
        this.renderWithdrawals();
        break;
      case 'trades':
        this.trades = sortBy(this.trades, sortKey);
        this.renderTrades();
        break;
    }
  }
  
  getCurrentPageType() {
    const activePage = document.querySelector('.page.active');
    if (!activePage) return null;
    
    const pageId = activePage.id;
    return pageId.replace('-page', '');
  }
  
  // Export functions for admin
  exportUserData() {
    const users = state.getUsers();
    const exportData = users.map(user => ({
      'Full Name': user.fullName,
      'Email': user.email,
      'Role': user.role,
      'Email Verified': user.emailVerified ? 'Yes' : 'No',
      'USD Balance': user.balances?.USD || 0,
      'BTC Balance': user.balances?.BTC || 0,
      'ETH Balance': user.balances?.ETH || 0,
      'Created At': formatDateTime(user.createdAt),
      'Last Login': user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'
    }));
    
    exportToCSV(exportData, `maxprofit-users-${new Date().toISOString().split('T')[0]}.csv`);
    showToast('User data exported successfully', 'success');
  },
  
  exportTransactionData() {
    const transactions = state.getTransactions();
    const users = state.getUsers();
    
    const exportData = transactions.map(transaction => {
      const user = users.find(u => u._id === transaction.userId);
      return {
        'Date': formatDateTime(transaction.createdAt),
        'User': user ? user.fullName : 'Unknown',
        'Email': user ? user.email : 'Unknown',
        'Type': transaction.type,
        'Amount': transaction.amount,
        'Currency': transaction.currency,
        'Status': transaction.status,
        'Note': transaction.note || ''
      };
    });
    
    exportToCSV(exportData, `maxprofit-transactions-${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Transaction data exported successfully', 'success');
  },
  
  getActivityIcon(type) {
    const icons = {
      user: 'user-plus',
      withdrawal: 'money-check-alt',
      trade: 'chart-line',
      system: 'cog'
    };
    
    return icons[type] || 'circle';
  }
  
  confirmLogout() {
    if (confirm('Are you sure you want to logout?')) {
      SessionManager.clearSession();
      window.location.href = 'login.html';
    }
  }
  
  onPageChange(page) {
    // Handle page-specific logic
    switch (page) {
      case 'users':
        this.renderUsers();
        break;
      case 'withdrawals':
        this.renderWithdrawals();
        break;
      case 'trades':
        this.renderTrades();
        break;
      case 'notifications':
        this.renderSentNotifications();
        break;
    }
  }
  
  refreshActivity() {
    this.renderAdminActivity();
    showToast('Activity refreshed', 'success');
  }
}

// Initialize admin dashboard
let admin;

document.addEventListener('DOMContentLoaded', () => {
  admin = new AdminDashboard();
  
  // Make admin available globally for onclick handlers
  window.admin = admin;
});

// Export for external use
export { AdminDashboard };