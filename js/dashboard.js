// Dashboard JavaScript - Mobile Trading App

class TradingDashboard {
    constructor() {
        this.currentUser = null;
        this.currentPage = 'home';
        this.isBalanceVisible = true;
        this.currentSymbol = 'BTC/USD';
        this.watchlist = [];
        this.positions = [];
        this.transactions = [];
        this.notifications = [];
        this.init();
    }

    init() {
        this.updateTime();
        this.setupEventListeners();
        this.loadUserData();
        this.updateUI();
        this.startRealTimeUpdates();
        setInterval(() => this.updateTime(), 60000);
    }
    
    async loadUserData() {
        const session = SessionManager.getSession();
        if (!session) {
            window.location.href = 'login.html';
            return;
        }
        
        // Get user from local state
        this.currentUser = state.getUserById(session.userId);
        if (!this.currentUser) {
            SessionManager.clearSession();
            window.location.href = 'login.html';
            return;
        }
        
        this.updateUserInterface();
        this.loadUserTransactions();
        this.loadUserNotifications();
    }

    updateUserInterface() {
        if (!this.currentUser) return;
        
        // Update username display
        const usernameEl = document.getElementById('username');
        if (usernameEl) usernameEl.textContent = this.currentUser.fullName;
        
        // Update profile page
        const profileNameEl = document.getElementById('profile-name');
        const profileEmailEl = document.getElementById('profile-email');
        if (profileNameEl) profileNameEl.textContent = this.currentUser.fullName;
        if (profileEmailEl) profileEmailEl.textContent = this.currentUser.email;
        
        this.updatePortfolioFromUser();
        this.updateProfileStats();
    }
    
    updateProfileStats() {
        if (!this.currentUser) return;
        
        const trades = state.getTrades(this.currentUser._id);
        const totalTrades = trades.length;
        const winningTrades = trades.filter(t => t.pnl > 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(1) : 0;
        const daysActive = Math.floor((Date.now() - this.currentUser.createdAt) / (24 * 60 * 60 * 1000));
        
        const totalTradesEl = document.getElementById('total-trades');
        const winRateEl = document.getElementById('win-rate');
        const daysActiveEl = document.getElementById('days-active');
        
        if (totalTradesEl) totalTradesEl.textContent = totalTrades;
        if (winRateEl) winRateEl.textContent = `${winRate}%`;
        if (daysActiveEl) daysActiveEl.textContent = daysActive;
    }

    updatePortfolioFromUser() {
        if (!this.currentUser) return;
        
        const { USD, BTC, ETH } = this.currentUser.balances;
        const prices = state.getPrices();
        const totalValue = USD + (BTC * prices['BTC/USD']) + (ETH * prices['ETH/USD']);
        
        const balanceEl = document.getElementById('portfolioBalance');
        const availableEl = document.getElementById('available-balance');
        
        if (balanceEl && this.isBalanceVisible) {
            balanceEl.textContent = formatCurrency(totalValue);
        }
        
        if (availableEl) {
            availableEl.textContent = formatCurrency(USD);
        }
        
        // Calculate today's P&L from trades
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const todayTrades = state.getTrades(this.currentUser._id)
            .filter(t => t.openedAt >= todayStart && t.status === 'closed');
        const todayPnL = todayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
        
        const pnlEl = document.getElementById('pnl-today');
        if (pnlEl) {
            pnlEl.textContent = formatCurrency(todayPnL);
            pnlEl.className = `stat-value ${todayPnL >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Calculate margin used from open trades
        const openTrades = state.getTrades(this.currentUser._id)
            .filter(t => t.status === 'open');
        const marginUsed = openTrades.reduce((sum, trade) => sum + (trade.qty * trade.entryPrice), 0);
        
        const marginEl = document.getElementById('margin-used');
        if (marginEl) {
            marginEl.textContent = formatCurrency(marginUsed);
        }
    }
    
    loadUserTransactions() {
        if (!this.currentUser) return;
        
        this.transactions = state.getTransactions(this.currentUser._id)
            .sort((a, b) => b.createdAt - a.createdAt);
    }
    
    loadUserNotifications() {
        if (!this.currentUser) return;
        
        this.notifications = state.getNotifications(this.currentUser._id)
            .sort((a, b) => b.createdAt - a.createdAt);
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
        
        // Symbol selector
        this.setupSymbolSelector();
        
        // Transaction filters
        this.setupTransactionFilters();
        
        // Profile menu items
        this.setupProfileMenu();
    }
    
    setupSymbolSelector() {
        const symbolSelector = document.getElementById('symbolSelector');
        if (symbolSelector) {
            symbolSelector.addEventListener('click', () => {
                this.showSymbolModal();
            });
        }
        
        // Category tabs
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.getAttribute('data-category');
                this.showSymbolCategory(category);
                
                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }
    
    showSymbolModal() {
        const modal = document.getElementById('symbolModal');
        if (modal) {
            modal.classList.add('active');
            this.showSymbolCategory('crypto');
        }
    }
    
    showSymbolCategory(category) {
        const symbolList = document.getElementById('symbolList');
        if (!symbolList) return;
        
        const symbols = APP_CONFIG.SYMBOLS[category] || [];
        const prices = state.getPrices();
        
        symbolList.innerHTML = symbols.map(symbol => {
            const price = prices[symbol.symbol] || 0;
            const change = (Math.random() - 0.5) * price * 0.02; // Simulate change
            const changePercent = (change / price) * 100;
            
            return `
                <div class="symbol-item" onclick="tradingDashboard.selectSymbol('${symbol.symbol}')">
                    <div class="symbol-info">
                        <span class="symbol-name">${symbol.symbol}</span>
                        <span class="symbol-description">${symbol.name}</span>
                    </div>
                    <div class="symbol-price">
                        <span class="price">$${price.toFixed(symbol.decimals)}</span>
                        <span class="change ${change >= 0 ? 'positive' : 'negative'}">
                            ${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    selectSymbol(symbol) {
        this.currentSymbol = symbol;
        
        // Update display
        const currentSymbolEl = document.getElementById('current-symbol');
        if (currentSymbolEl) currentSymbolEl.textContent = symbol;
        
        this.updateTradingPrices();
        this.closeSymbolModal();
    }
    
    closeSymbolModal() {
        const modal = document.getElementById('symbolModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    updateTradingPrices() {
        const prices = state.getPrices();
        const currentPrice = prices[this.currentSymbol] || 0;
        const spread = currentPrice * 0.0002; // 0.02% spread
        
        const bidPriceEl = document.getElementById('bid-price');
        const askPriceEl = document.getElementById('ask-price');
        const symbolChangeEl = document.getElementById('symbol-change');
        
        if (bidPriceEl) bidPriceEl.textContent = (currentPrice - spread).toFixed(2);
        if (askPriceEl) askPriceEl.textContent = (currentPrice + spread).toFixed(2);
        
        // Simulate price change
        const change = (Math.random() - 0.5) * currentPrice * 0.01;
        const changePercent = (change / currentPrice) * 100;
        
        if (symbolChangeEl) {
            symbolChangeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${change >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
            symbolChangeEl.className = `price-change ${change >= 0 ? 'positive' : 'negative'}`;
        }
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
                this.updateTradingPrices();
                break;
            case 'transactions':
                this.loadTransactions();
                break;
            case 'notifications':
                this.loadNotifications();
                break;
            case 'support':
                this.loadLivePayments();
                break;
        }
    }
    
    loadLivePayments() {
        // Initialize live payment manager
        if (window.livePaymentManager) {
            livePaymentManager.renderActivities();
            
            // Update stats
            const stats = livePaymentManager.getTotalStats();
            const totalDepositsEl = document.getElementById('total-deposits');
            const totalWithdrawalsEl = document.getElementById('total-withdrawals');
            
            if (totalDepositsEl) totalDepositsEl.textContent = formatCurrency(stats.totalDeposits, 'USD', 0);
            if (totalWithdrawalsEl) totalWithdrawalsEl.textContent = formatCurrency(stats.totalWithdrawals, 'USD', 0);
        }
    }
    
    updateWatchlist() {
        // Use real price data
        const prices = state.getPrices();
        const symbols = ['BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD', 'AAPL'];
        
        this.watchlist = symbols.map(symbol => {
            const price = prices[symbol] || 0;
            const change = (Math.random() - 0.5) * price * 0.02;
            const changePercent = (change / price) * 100;
            
            const symbolInfo = this.getSymbolInfo(symbol);
            
            return {
                symbol,
                name: symbolInfo ? symbolInfo.name : symbol,
                price,
                change,
                changePercent
            };
        });
        
        this.renderWatchlist();
    }
    
    getSymbolInfo(symbol) {
        const allSymbols = [
            ...APP_CONFIG.SYMBOLS.crypto,
            ...APP_CONFIG.SYMBOLS.forex,
            ...APP_CONFIG.SYMBOLS.stocks
        ];
        
        return allSymbols.find(s => s.symbol === symbol);
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
    }
    
    updatePositions() {
        // Load user's real positions
        if (!this.currentUser) return;
        
        this.positions = state.getTrades(this.currentUser._id)
            .filter(trade => trade.status === 'open')
            .map(trade => {
                const currentPrice = state.getPrices()[trade.symbol] || trade.entryPrice;
                const pnl = this.calculateTradePnL(trade, currentPrice);
                const pnlPercent = (pnl / (trade.entryPrice * trade.qty)) * 100;
                
                return {
                    ...trade,
                    currentPrice,
                    pnl,
                    pnlPercent
                };
            });
        
        this.renderPositions();
    }
    
    calculateTradePnL(trade, currentPrice) {
        const priceDiff = trade.side === 'buy' 
            ? currentPrice - trade.entryPrice 
            : trade.entryPrice - currentPrice;
        
        return priceDiff * trade.qty;
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
            container.innerHTML = '<div class="empty-state">No open positions. Start trading to see your positions here.</div>';
            return;
        }

        container.innerHTML = this.positions.map(position => `
            <div class="position-item">
                <div class="position-info">
                    <div class="position-symbol">${position.symbol} ${position.side.toUpperCase()}</div>
                    <div class="position-details">${position.qty} • $${position.entryPrice.toFixed(2)}</div>
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

        const recentTransactions = this.transactions.slice(0, 5);
        
        if (recentTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state">No recent activity</div>';
            return;
        }
        
        container.innerHTML = recentTransactions.map(transaction => `
            <div class="activity-item">
                <div class="activity-icon ${transaction.type}">
                    <i class="fas fa-${this.getTransactionIcon(transaction.type)}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${transaction.note || transaction.type}</div>
                    <div class="activity-subtitle">${getRelativeTime(transaction.createdAt)}</div>
                </div>
                <div class="activity-amount ${this.isPositiveTransaction(transaction.type) ? 'positive' : 'negative'}">
                    ${this.isPositiveTransaction(transaction.type) ? '+' : '-'}${formatCurrency(transaction.amount)}
                </div>
            </div>
        `).join('');
    }
    
    isPositiveTransaction(type) {
        return ['deposit', 'interest', 'bonus'].includes(type);
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
                    <div class="amount-primary ${this.isPositiveTransaction(transaction.type) ? 'positive' : 'negative'}">
                        ${this.isPositiveTransaction(transaction.type) ? '+' : '-'}${formatCurrency(transaction.amount)}
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
        
        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <h3>No notifications</h3>
                    <p>You're all caught up!</p>
                </div>
            `;
            return;
        }

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
            const prices = state.getPrices();
            position.currentPrice = prices[position.symbol] || position.entryPrice;
            
            if (position.side === 'buy') {
                position.pnl = (position.currentPrice - position.entryPrice) * position.qty;
            } else {
                position.pnl = (position.entryPrice - position.currentPrice) * position.qty;
            }
            
            position.pnlPercent = (position.pnl / (position.entryPrice * position.qty)) * 100;
        });

        // Update UI if we're on relevant pages
        if (this.currentPage === 'home') {
            this.updatePortfolioFromUser();
            this.updateWatchlist();
            this.updatePositions();
            this.updateRecentActivity();
        } else if (this.currentPage === 'trading') {
            this.updatePositions();
            this.updateTradingPrices();
        } else if (this.currentPage === 'support') {
            this.loadLivePayments();
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

// Make available globally
window.closeSymbolModal = function() {
    window.tradingDashboard.closeSymbolModal();
};