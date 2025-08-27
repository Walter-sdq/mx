// Dashboard JavaScript - Mobile Trading App
class TradingDashboard {
    constructor() {
        this.currentPage = 'home';
        this.isBalanceVisible = true;
        this.watchlist = [];
        this.positions = [];
        this.transactions = [];
        this.notifications = [];
        
        this.init();
    }

    init() {
        this.updateTime();
        this.setupEventListeners();
        this.loadMockData();
        this.updateUI();
        this.startRealTimeUpdates();
        
        // Update time every minute
        setInterval(() => this.updateTime(), 60000);
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
        }
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

    loadMockData() {
        // Mock watchlist data
        this.watchlist = [
            { symbol: 'EUR/USD', name: 'Euro/US Dollar', price: 1.0847, change: -0.0023, changePercent: -0.21 },
            { symbol: 'GBP/USD', name: 'British Pound/US Dollar', price: 1.2634, change: 0.0045, changePercent: 0.36 },
            { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen', price: 149.85, change: 0.32, changePercent: 0.21 },
            { symbol: 'BTC/USD', name: 'Bitcoin/US Dollar', price: 43250.00, change: 1250.00, changePercent: 2.98 },
            { symbol: 'ETH/USD', name: 'Ethereum/US Dollar', price: 2485.50, change: -45.30, changePercent: -1.79 }
        ];

        // Mock positions data
        this.positions = [
            {
                symbol: 'EUR/USD',
                type: 'BUY',
                volume: 1.0,
                openPrice: 1.0825,
                currentPrice: 1.0847,
                pnl: 22.00,
                pnlPercent: 0.20
            },
            {
                symbol: 'GBP/USD',
                type: 'SELL',
                volume: 0.5,
                openPrice: 1.2689,
                currentPrice: 1.2634,
                pnl: 27.50,
                pnlPercent: 0.43
            }
        ];

        // Mock transactions data
        this.transactions = [
            {
                id: '1',
                type: 'deposit',
                title: 'Bank Transfer Deposit',
                subtitle: 'Completed • Today 14:32',
                amount: 5000.00,
                status: 'completed'
            },
            {
                id: '2',
                type: 'trade',
                title: 'EUR/USD BUY',
                subtitle: '1.0 lot • Today 12:15',
                amount: 22.00,
                status: 'profit'
            },
            {
                id: '3',
                type: 'withdrawal',
                title: 'Bank Withdrawal',
                subtitle: 'Pending • Yesterday 16:45',
                amount: -1500.00,
                status: 'pending'
            },
            {
                id: '4',
                type: 'trade',
                title: 'GBP/USD SELL',
                subtitle: '0.5 lot • Yesterday 10:22',
                amount: 27.50,
                status: 'profit'
            }
        ];

        // Mock notifications data
        this.notifications = [
            {
                id: '1',
                type: 'success',
                title: 'Trade Executed',
                message: 'Your EUR/USD BUY order has been executed at 1.0825',
                time: '2 minutes ago',
                read: false
            },
            {
                id: '2',
                type: 'info',
                title: 'Deposit Confirmed',
                message: 'Your deposit of $5,000 has been processed successfully',
                time: '1 hour ago',
                read: false
            },
            {
                id: '3',
                type: 'warning',
                title: 'Margin Call Warning',
                message: 'Your account margin level is approaching 50%',
                time: '3 hours ago',
                read: true
            }
        ];
    }

    updateUI() {
        this.updateWatchlist();
        this.updatePositions();
        this.updateRecentActivity();
        this.updatePortfolioSummary();
    }

    updateWatchlist() {
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

    updatePositions() {
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
        const container = document.getElementById('recentActivity');
        if (!container) return;

        const recentTransactions = this.transactions.slice(0, 3);
        
        container.innerHTML = recentTransactions.map(transaction => `
            <div class="activity-item">
                <div class="activity-icon ${transaction.type}">
                    <i class="fas fa-${this.getTransactionIcon(transaction.type)}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${transaction.title}</div>
                    <div class="activity-subtitle">${transaction.subtitle}</div>
                </div>
                <div class="activity-amount ${transaction.amount >= 0 ? 'positive' : 'negative'}">
                    ${transaction.amount >= 0 ? '+' : ''}$${Math.abs(transaction.amount).toFixed(2)}
                </div>
            </div>
        `).join('');
    }

    updatePortfolioSummary() {
        // This would normally fetch real data from an API
        const summary = {
            balance: 24567.89,
            change: 1234.56,
            changePercent: 5.3,
            available: 12450.00,
            pnlToday: 892.34,
            marginUsed: 5200.00
        };

        // Update balance change
        const changeElement = document.getElementById('balanceChange');
        if (changeElement) {
            const isPositive = summary.change >= 0;
            changeElement.className = `balance-change ${isPositive ? 'positive' : 'negative'}`;
            changeElement.innerHTML = `
                <i class="fas fa-arrow-${isPositive ? 'up' : 'down'}"></i>
                <span>${isPositive ? '+' : ''}$${Math.abs(summary.change).toFixed(2)} (${isPositive ? '+' : ''}${summary.changePercent.toFixed(1)}%) today</span>
            `;
        }

        // Update quick stats
        const stats = document.querySelectorAll('.stat-value');
        if (stats.length >= 3) {
            stats[0].textContent = `$${summary.available.toFixed(2)}`;
            stats[1].textContent = `+$${summary.pnlToday.toFixed(2)}`;
            stats[1].className = 'stat-value positive';
            stats[2].textContent = `$${summary.marginUsed.toFixed(2)}`;
        }
    }

    loadTransactions() {
        const container = document.getElementById('transactionsList');
        if (!container) return;

        container.innerHTML = this.transactions.map(transaction => `
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

    loadNotifications() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        container.innerHTML = this.notifications.map(notification => `
            <div class="notification-item ${!notification.read ? 'unread' : ''}">
                <div class="notification-icon ${notification.type}">
                    <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${notification.time}</div>
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
        console.log('Show deposit modal');
        // Implementation would show a deposit modal
    }

    showWithdrawModal() {
        console.log('Show withdraw modal');
        // Implementation would show a withdraw modal
    }

    showTransferModal() {
        console.log('Show transfer modal');
        // Implementation would show a transfer modal
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear session and redirect to login
            sessionStorage.clear();
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