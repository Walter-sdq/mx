// Dashboard JavaScript - Mobile Trading App

class TradingDashboard {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.isBalanceVisible = true;
        this.watchlist = [];
        this.positions = [];
        this.transactions = [];
        this.notifications = [];
        this.init();
    }

    init() {
        this.loadUserData();
        this.updateTime();
        this.setupEventListeners();
        this.loadUserData();
        this.updateUI();
        this.startRealTimeUpdates();
        setInterval(() => this.updateTime(), 60000);
    }
    
    async loadUserData() {
        const session = window.SessionManager.getSession();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        // Fetch user profile from Supabase
        const { data, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', session.userId)
            .single();
        if (error || !data) {
            window.location.href = 'login.html';
            return;
        }
        this.currentUser = data;
        this.updateUserInterface();
        this.loadUserTransactions();
        this.loadUserNotifications();
        this.loadUserBalances();
        this.loadPnL();
        this.loadMarginUsed();
    }

    updateUserInterface() {
        if (!this.currentUser) return;
        const usernameEl = document.getElementById('username');
        if (usernameEl) usernameEl.textContent = this.currentUser.full_name;
        this.updatePortfolioFromUser();
    }

    async loadUserBalances() {
        // Example: fetch balances from Supabase (customize as needed)
        const { data, error } = await window.supabase
            .from('balances')
            .select('*')
            .eq('user_id', this.currentUser.id);
        if (!error && data && data.length > 0) {
            // Update UI with balances
            const balanceEl = document.getElementById('available-balance');
            if (balanceEl) balanceEl.textContent = `$${data[0].usd.toFixed(2)}`;
        }
    }

    async loadPnL() {
        // Example: fetch today's P&L from Supabase (customize as needed)
        const { data, error } = await window.supabase
            .rpc('get_pnl_today', { user_id: this.currentUser.id });
        const pnlEl = document.getElementById('pnl-today');
        if (pnlEl && data) pnlEl.textContent = `$${data.toFixed(2)}`;
    }

    async loadMarginUsed() {
        // Example: fetch margin used from Supabase (customize as needed)
        const { data, error } = await window.supabase
            .rpc('get_margin_used', { user_id: this.currentUser.id });
        const marginEl = document.getElementById('margin-used');
        if (marginEl && data) marginEl.textContent = `$${data.toFixed(2)}`;
    }

    updatePortfolioFromUser() {
        if (!this.currentUser) return;
        
        const { USD, BTC, ETH } = this.currentUser.balances;
        const prices = state.getPrices();
        const totalValue = USD + (BTC * prices['BTC/USD']) + (ETH * prices['ETH/USD']);
        
        const balanceEl = document.getElementById('portfolioBalance');
        if (balanceEl && this.isBalanceVisible) {
            balanceEl.textContent = formatCurrency(totalValue);
        }
        
        // Update quick stats
        const stats = document.querySelectorAll('.stat-value');
        if (stats.length >= 3) {
            stats[0].textContent = formatCurrency(USD);
            stats[1].textContent = formatCurrency(0); // P&L starts at 0
            stats[2].textContent = formatCurrency(0); // Margin used starts at 0
        }
    }
    
    loadUserTransactions() {
        if (!this.currentUser) return;
        
        this.transactions = state.getTransactions(this.currentUser._id);
    }
    
    loadUserNotifications() {
        if (!this.currentUser) return;
        
        this.notifications = state.getNotifications(this.currentUser._id);
    }

    setupEventListeners() {
        // Bottom navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                this.navigateToPage(page);
            });
        });

        // Balance visibility toggle
        const balanceToggle = document.getElementById('balanceToggle');
        if (balanceToggle) {
            balanceToggle.addEventListener('click', () => this.toggleBalanceVisibility());
        }

        // Quick actions
        this.setupQuickActions();
        
        // Trading controls
        this.setupTradingControls();
        
        // Transaction filters
        this.setupTransactionFilters();
        
        // Profile menu items
        this.setupProfileMenu();
    }

    setupQuickActions() {
        const actions = {
            'depositBtn': () => this.showDepositModal(),
            'withdrawBtn': () => this.showWithdrawModal(),
            'transferBtn': () => this.showTransferModal(),
            'historyBtn': () => this.navigateToPage('transactions')
        };

        Object.entries(actions).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener('click', handler);
        });
    }

    setupTradingControls() {
        // Order type buttons
        document.querySelectorAll('.order-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.order-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Volume buttons
        document.querySelectorAll('.volume-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const volume = e.currentTarget.dataset.volume;
                document.querySelector('.volume-input').value = volume;
                document.querySelectorAll('.volume-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Timeframe buttons
        document.querySelectorAll('.tf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.updateChart();
            });
        });

        // Trade tabs
        document.querySelectorAll('.trade-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.trade-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.updateTradeForm(e.currentTarget.dataset.tab);
            });
        });

        // Execute trade button
        const executeBtn = document.getElementById('executeTrade');
        if (executeBtn) {
            executeBtn.addEventListener('click', () => this.executeTrade());
        }
    }

    setupTransactionFilters() {
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                e.currentTarget.classList.add('active');
                this.filterTransactions(e.currentTarget.dataset.filter);
            });
        });
    }

    setupProfileMenu() {
        const menuItems = {
            'personalInfo': () => console.log('Personal Info'),
            'security': () => console.log('Security'),
            'verification': () => console.log('Verification'),
            'notifications': () => console.log('Notification Settings'),
            'language': () => console.log('Language Settings'),
            'currency': () => console.log('Currency Settings'),
            'help': () => console.log('Help Center'),
            'contact': () => console.log('Contact Support'),
            'terms': () => console.log('Terms & Conditions'),
            'logout': () => this.logout()
        };

        Object.entries(menuItems).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) element.addEventListener('click', handler);
        });
    }

    navigateToPage(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Show selected page
        const targetPage = document.getElementById(`${page}Page`);
        if (targetPage) {
            targetPage.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        this.currentPage = page;

        // Load page-specific data
        switch (page) {
            case 'trading':
                this.initTradingChart();
                break;
            case 'transactions':
                this.loadTransactions();
                break;
            case 'notifications':
                this.loadNotifications();
                break;
            case 'support':
                this.loadLiveSupport();
                break;
        }
    }
    
    loadLiveSupport() {
        // Initialize live support manager
        liveSupportManager.renderActivities();
        
        // Update stats
        const stats = liveSupportManager.getTotalStats();
        const activeUsersEl = document.getElementById('active-users');
        const totalVolumeEl = document.getElementById('total-volume');
        
        if (activeUsersEl) activeUsersEl.textContent = stats.activeUsers.toLocaleString();
        if (totalVolumeEl) totalVolumeEl.textContent = formatCurrency(stats.totalDeposits, 'USD', 0);
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });
        
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = timeString;
        }

        // Update greeting
        const hour = now.getHours();
        let greeting = 'Good morning';
        if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
        else if (hour >= 18) greeting = 'Good evening';

        const greetingElement = document.getElementById('greeting');
        if (greetingElement) {
            greetingElement.textContent = greeting;
        }
    }

    toggleBalanceVisibility() {
        this.isBalanceVisible = !this.isBalanceVisible;
        const balanceElement = document.getElementById('portfolioBalance');
        const toggleIcon = document.querySelector('#balanceToggle i');

        if (balanceElement && toggleIcon) {
            if (this.isBalanceVisible) {
                balanceElement.textContent = '$24,567.89';
                toggleIcon.className = 'fas fa-eye';
            } else {
                balanceElement.textContent = '****';
                toggleIcon.className = 'fas fa-eye-slash';
            }
        }
    }

    updateUI() {
        this.updateWatchlist();
        this.updatePositions();
        this.updateRecentActivity();
        this.updatePortfolioFromUser();
    }
    
    updateWatchlist() {
        // Real watchlist data from prices
        this.watchlist = [
            { symbol: 'EUR/USD', name: 'Euro/US Dollar', price: 1.0847, change: -0.0023, changePercent: -0.21 },
            { symbol: 'GBP/USD', name: 'British Pound/US Dollar', price: 1.2634, change: 0.0045, changePercent: 0.36 },
            { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen', price: 149.85, change: 0.32, changePercent: 0.21 },
            { symbol: 'BTC/USD', name: 'Bitcoin/US Dollar', price: 43250.00, change: 1250.00, changePercent: 2.98 },
            { symbol: 'ETH/USD', name: 'Ethereum/US Dollar', price: 2485.50, change: -45.30, changePercent: -1.79 }
        ];
        
        this.renderWatchlist();
    }
    
    updatePositions() {
        // Load user's actual positions
        if (!this.currentUser) return;
        
        this.positions = [
            // Positions start empty - only admin can create
        ];
        
        this.renderPositions();
    }
    
    renderWatchlist() {
        const container = document.getElementById('watchlistContainer');
        if (!container) return;

        container.innerHTML = this.watchlist.map(item => `
            <div class="watchlist-item">
                <div class="watchlist-symbol">
                    <div class="symbol-name">${item.symbol}</div>
                    <div class="symbol-description">${item.name}</div>
                </div>
                <div class="watchlist-price">
                    <div class="price">${item.price.toFixed(item.symbol.includes('JPY') ? 2 : 4)}</div>
                    <div class="price-change ${item.change >= 0 ? 'positive' : 'negative'}">
                        ${item.change >= 0 ? '+' : ''}${item.change.toFixed(4)} (${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%)
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPositions() {
        const container = document.getElementById('positionsList');
        const countElement = document.getElementById('positionCount');
        
        if (!container) return;

        if (countElement) {
            countElement.textContent = this.positions.length;
        }

        if (this.positions.length === 0) {
            container.innerHTML = '<div class="empty-state">No open positions</div>';
            return;
        }

        container.innerHTML = this.positions.map(position => `
            <div class="position-item">
                <div class="position-info">
                    <div class="position-symbol">${position.symbol} ${position.type}</div>
                    <div class="position-details">${position.volume} lot • ${position.openPrice.toFixed(4)}</div>
                </div>
                <div class="position-pnl">
                    <div class="pnl-amount ${position.pnl >= 0 ? 'positive' : 'negative'}">
                        ${position.pnl >= 0 ? '+' : ''}$${Math.abs(position.pnl).toFixed(2)}
                    </div>
                    <div class="pnl-percentage">${position.pnlPercent >= 0 ? '+' : ''}${position.pnlPercent.toFixed(2)}%</div>
                </div>
            </div>
        `).join('');
    }

    updateRecentActivity() {
        if (!this.currentUser) return;
        
        const container = document.getElementById('recentActivity');
        if (!container) return;

        const recentTransactions = this.transactions.slice(0, 3);
        
        container.innerHTML = recentTransactions.map(transaction => `
            <div class="activity-item">
                <div class="activity-icon ${transaction.type}">
                    <i class="fas fa-${this.getTransactionIcon(transaction.type)}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${transaction.note || transaction.type}</div>
                    <div class="activity-subtitle">${getRelativeTime(transaction.createdAt)}</div>
                </div>
                <div class="activity-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                    ${transaction.amount >= 0 ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    loadTransactions() {
        if (!this.currentUser) return;
        
        const container = document.getElementById('transactionsList');
        if (!container) return;

        container.innerHTML = this.transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fas fa-${this.getTransactionIcon(transaction.type)}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.note || transaction.type}</div>
                    <div class="transaction-subtitle">${getRelativeTime(transaction.createdAt)} • ${transaction.status}</div>
                </div>
                <div class="transaction-amount">
                    <div class="amount-primary ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                        ${transaction.amount >= 0 ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                    <div class="amount-secondary">${transaction.status}</div>
                </div>
            </div>
        `).join('');
    }

    loadNotifications() {
        if (!this.currentUser) return;
        
        const container = document.getElementById('notificationsList');
        if (!container) return;

        container.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${!notification.read ? 'unread' : ''}">
                <div class="notification-icon ${notification.type || 'info'}">
                    <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.body}</div>
                    <div class="notification-time">${getRelativeTime(notification.createdAt)}</div>
                </div>
            </div>
        `).join('');
    }

    filterTransactions(filter) {
        let filteredTransactions = this.transactions;
        
        if (filter !== 'all') {
            filteredTransactions = this.transactions.filter(t => {
                switch (filter) {
                    case 'deposits':
                        return t.type === 'deposit';
                    case 'withdrawals':
                        return t.type === 'withdrawal';
                    case 'trades':
                        return t.type === 'trade';
                    default:
                        return true;
                }
            });
        }

        const container = document.getElementById('transactionsList');
        if (!container) return;

        container.innerHTML = filteredTransactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fas fa-${this.getTransactionIcon(transaction.type)}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.title}</div>
                    <div class="transaction-subtitle">${transaction.subtitle}</div>
                </div>
                <div class="transaction-amount">
                    <div class="amount-primary ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                        ${transaction.amount >= 0 ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}
                    </div>
                    <div class="amount-secondary">${transaction.status}</div>
                </div>
            </div>
        `).join('');
    }

    initTradingChart() {
        const canvas = document.getElementById('tradingChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw simple candlestick chart placeholder
        this.drawSimpleChart(ctx, width, height);
    }

    drawSimpleChart(ctx, width, height) {
        // Generate sample data
        const data = [];
        let price = 1.0847;
        
        for (let i = 0; i < 50; i++) {
            const change = (Math.random() - 0.5) * 0.01;
            price += change;
            data.push({
                price: price,
                high: price + Math.random() * 0.005,
                low: price - Math.random() * 0.005,
                volume: Math.random() * 1000000
            });
        }

        // Draw price line
        ctx.strokeStyle = '#1a73e8';
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((point, i) => {
            const x = (i / (data.length - 1)) * width;
            const y = height - ((point.price - 1.08) / 0.01) * height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw grid lines
        ctx.strokeStyle = '#e8eaed';
        ctx.lineWidth = 1;
        
        // Horizontal lines
        for (let i = 1; i < 5; i++) {
            const y = (i / 5) * height;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Vertical lines
        for (let i = 1; i < 10; i++) {
            const x = (i / 10) * width;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    }

    updateChart() {
        // Re-draw chart with new timeframe data
        this.initTradingChart();
    }

    updateTradeForm(tabType) {
        // Update trade form based on selected tab (market, limit, stop)
        console.log('Updating trade form for:', tabType);
    }

    executeTrade() {
        const orderType = document.querySelector('.order-btn.active');
        const volume = document.querySelector('.volume-input').value;
        
        if (!orderType || !volume) {
            alert('Please select order type and volume');
            return;
        }

        this.showLoadingOverlay();
        
        // Simulate trade execution
        setTimeout(() => {
            this.hideLoadingOverlay();
            alert(`${orderType.textContent} order executed successfully!`);
            
            // Add to positions (mock)
            this.positions.push({
                symbol: 'EUR/USD',
                type: orderType.textContent.includes('BUY') ? 'BUY' : 'SELL',
                volume: parseFloat(volume),
                openPrice: 1.0847,
                currentPrice: 1.0847,
                pnl: 0,
                pnlPercent: 0
            });
            
            this.updatePositions();
        }, 2000);
    }

    showDepositModal() {
        window.location.href = 'deposit.html';
    }

    showWithdrawModal() {
        window.location.href = 'withdraw.html';
    }

    showTransferModal() {
        console.log('Show transfer modal');
        // Implementation would show a transfer modal
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            SessionManager.clearSession();
            window.location.href = 'login.html';
        }
    }

    showLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.add('show');
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) overlay.classList.remove('show');
    }

    startRealTimeUpdates() {
        // Simulate real-time price updates
        setInterval(() => {
            this.updatePrices();
        }, 3000);
    }

    updatePrices() {
        // Update watchlist prices with random changes
        this.watchlist.forEach(item => {
            const change = (Math.random() - 0.5) * 0.001;
            item.price += change;
            item.change += change;
            item.changePercent = (item.change / (item.price - item.change)) * 100;
        });

        // Update positions P&L
        this.positions.forEach(position => {
            const change = (Math.random() - 0.5) * 0.001;
            position.currentPrice += change;
            
            if (position.type === 'BUY') {
                position.pnl = (position.currentPrice - position.openPrice) * position.volume * 100000;
            } else {
                position.pnl = (position.openPrice - position.currentPrice) * position.volume * 100000;
            }
            
            position.pnlPercent = (position.pnl / (position.openPrice * position.volume * 100000)) * 100;
        });

        // Update UI if we're on relevant pages
        if (this.currentPage === 'home') {
            this.updateWatchlist();
            this.updatePositions();
        } else if (this.currentPage === 'trading') {
            this.updatePositions();
            // Update trading prices
            const bidPrice = document.querySelector('.bid-price');
            const askPrice = document.querySelector('.ask-price');
            if (bidPrice && askPrice) {
                const currentBid = parseFloat(bidPrice.textContent);
                const newBid = currentBid + (Math.random() - 0.5) * 0.0001;
                bidPrice.textContent = newBid.toFixed(4);
                askPrice.textContent = (newBid + 0.0002).toFixed(4);
            }
        }
    }

    getTransactionIcon(type) {
        const icons = {
            'deposit': 'arrow-down',
            'withdrawal': 'arrow-up', 
            'trade': 'chart-line',
            'transfer': 'exchange-alt'
        };
        return icons[type] || 'circle';
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'danger': 'exclamation-circle'
        };
        return icons[type] || 'bell';
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.tradingDashboard = new TradingDashboard();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TradingDashboard;
}