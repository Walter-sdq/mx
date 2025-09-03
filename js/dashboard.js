// Dashboard JavaScript - Production Ready
import { authManager } from './auth.js';
import { apiClient } from './api.js';
import { realTimePrices } from './realtime.js';
import { formatCurrency, formatDateTime, getRelativeTime, showToast, showLoading } from './utils.js';

class TradingDashboard {
    constructor() {
        this.currentUser = null;
        this.currentProfile = null;
        this.currentPage = 'home';
        this.isBalanceVisible = true;
        this.currentSymbol = 'BTC/USD';
        this.watchlist = [];
        this.positions = [];
        this.transactions = [];
        this.notifications = [];
        this.init();
    }

    async init() {
        // Check authentication
        if (!authManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        this.currentUser = authManager.getUser();
        this.currentProfile = authManager.getProfile();

        if (!this.currentUser || !this.currentProfile) {
            window.location.href = 'login.html';
            return;
        }

        this.updateTime();
        this.setupEventListeners();
        await this.loadUserData();
        this.updateUI();
        this.startRealTimeUpdates();
        setInterval(() => this.updateTime(), 60000);
    }
    
    async loadUserData() {
        try {
            // Load user transactions
            const { data: transactions } = await apiClient.getTransactions(this.currentUser.id);
            this.transactions = transactions || [];
            
            // Load user trades
            const { data: trades } = await apiClient.getTrades(this.currentUser.id);
            this.positions = (trades || []).filter(trade => trade.status === 'open');
            
            // Load user notifications
            const { data: notifications } = await apiClient.getNotifications(this.currentUser.id);
            this.notifications = notifications || [];
            
            this.updateUserInterface();
        } catch (error) {
            console.error('Failed to load user data:', error);
            showToast('Failed to load user data', 'error');
        }
    }

    updateUserInterface() {
        if (!this.currentProfile) return;
        
        // Update username display
        const usernameEl = document.getElementById('username');
        if (usernameEl) usernameEl.textContent = this.currentProfile.full_name;
        
        // Update profile page
        const profileNameEl = document.getElementById('profileName');
        const profileEmailEl = document.getElementById('profileEmail');
        if (profileNameEl) profileNameEl.textContent = this.currentProfile.full_name;
        if (profileEmailEl) profileEmailEl.textContent = this.currentProfile.email;
        
        // Update notification count
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const notificationCountEl = document.getElementById('notification-count');
        if (notificationCountEl) {
            notificationCountEl.textContent = unreadCount;
            notificationCountEl.style.display = unreadCount > 0 ? 'block' : 'none';
        }
        
        this.updatePortfolioFromUser();
        this.updateProfileStats();
    }
    
    updateProfileStats() {
        if (!this.currentProfile) return;
        
        const totalTrades = this.transactions.filter(t => t.type === 'trade').length;
        const winningTrades = this.transactions.filter(t => t.type === 'trade' && t.amount > 0).length;
        const winRate = totalTrades > 0 ? (winningTrades / totalTrades * 100).toFixed(1) : 0;
        const daysActive = Math.floor((Date.now() - new Date(this.currentProfile.created_at).getTime()) / (24 * 60 * 60 * 1000));
        
        const totalTradesEl = document.getElementById('profileTotalTrades');
        const winRateEl = document.getElementById('profileWinRate');
        const daysActiveEl = document.getElementById('profileDaysActive');
        
        if (totalTradesEl) totalTradesEl.textContent = totalTrades;
        if (winRateEl) winRateEl.textContent = `${winRate}%`;
        if (daysActiveEl) daysActiveEl.textContent = daysActive;
    }

    updatePortfolioFromUser() {
        if (!this.currentProfile) return;
        
        const balances = this.currentProfile.balances || { USD: 0, BTC: 0, ETH: 0 };
        const prices = realTimePrices.getAllPrices();
        const totalValue = balances.USD + 
                          (balances.BTC * (prices['BTC/USD'] || 43250)) + 
                          (balances.ETH * (prices['ETH/USD'] || 2580));
        
        const balanceEl = document.getElementById('portfolioBalance');
        const availableEl = document.getElementById('available-balance');
        
        if (balanceEl && this.isBalanceVisible) {
            balanceEl.textContent = formatCurrency(totalValue);
        }
        
        if (availableEl) {
            availableEl.textContent = formatCurrency(balances.USD);
        }
        
        // Calculate today's P&L from trades
        const todayStart = new Date().setHours(0, 0, 0, 0);
        const todayTrades = this.transactions.filter(t => 
            t.type === 'trade' && 
            new Date(t.created_at).getTime() >= todayStart
        );
        const todayPnL = todayTrades.reduce((sum, trade) => sum + (trade.amount || 0), 0);
        
        const pnlEl = document.getElementById('pnl-today');
        if (pnlEl) {
            pnlEl.textContent = formatCurrency(todayPnL);
            pnlEl.className = `stat-value ${todayPnL >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Calculate margin used from open trades
        const marginUsed = this.positions.reduce((sum, trade) => 
            sum + (trade.quantity * trade.entry_price), 0);
        
        const marginEl = document.getElementById('margin-used');
        if (marginEl) {
            marginEl.textContent = formatCurrency(marginUsed);
        }
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
        
        // Notification handlers
        this.setupNotificationHandlers();
    }
    
    setupNotificationHandlers() {
        const notificationBtn = document.getElementById('notificationBtn');
        const markAllReadBtn = document.getElementById('markAllRead');
        
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.navigateToPage('notifications');
            });
        }
        
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', async () => {
                try {
                    await apiClient.markAllNotificationsRead(this.currentUser.id);
                    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
                    this.updateUserInterface();
                    this.loadNotifications();
                    showToast('All notifications marked as read', 'success');
                } catch (error) {
                    console.error('Mark all read error:', error);
                    showToast('Failed to mark notifications as read', 'error');
                }
            });
        }
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
        
        const symbols = {
            crypto: [
                { symbol: 'BTC/USD', name: 'Bitcoin' },
                { symbol: 'ETH/USD', name: 'Ethereum' },
                { symbol: 'LTC/USD', name: 'Litecoin' },
                { symbol: 'XRP/USD', name: 'Ripple' },
                { symbol: 'ADA/USD', name: 'Cardano' },
                { symbol: 'DOT/USD', name: 'Polkadot' }
            ],
            forex: [
                { symbol: 'EUR/USD', name: 'Euro / US Dollar' },
                { symbol: 'GBP/USD', name: 'British Pound / US Dollar' },
                { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen' },
                { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar' }
            ],
            stocks: [
                { symbol: 'AAPL', name: 'Apple Inc.' },
                { symbol: 'GOOGL', name: 'Alphabet Inc.' },
                { symbol: 'MSFT', name: 'Microsoft Corporation' },
                { symbol: 'TSLA', name: 'Tesla Inc.' }
            ]
        };
        
        const categorySymbols = symbols[category] || [];
        
        symbolList.innerHTML = categorySymbols.map(symbol => {
            const priceData = realTimePrices.getPriceData(symbol.symbol);
            const price = priceData?.price || 0;
            const changePercent = priceData?.changePercent || 0;
            
            return `
                <div class="symbol-item" onclick="tradingDashboard.selectSymbol('${symbol.symbol}')">
                    <div class="symbol-info">
                        <span class="symbol-name">${symbol.symbol}</span>
                        <span class="symbol-description">${symbol.name}</span>
                    </div>
                    <div class="symbol-price">
                        <span class="price">$${price.toFixed(2)}</span>
                        <span class="change ${changePercent >= 0 ? 'positive' : 'negative'}">
                            ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%
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
        const priceData = realTimePrices.getPriceData(this.currentSymbol);
        if (!priceData) return;
        
        const spread = priceData.price * 0.0002; // 0.02% spread
        
        const bidPriceEl = document.getElementById('bid-price');
        const askPriceEl = document.getElementById('ask-price');
        const symbolChangeEl = document.getElementById('symbol-change');
        const buyPriceEl = document.querySelector('.buy-price');
        const sellPriceEl = document.querySelector('.sell-price');
        
        if (bidPriceEl) bidPriceEl.textContent = (priceData.price - spread).toFixed(2);
        if (askPriceEl) askPriceEl.textContent = (priceData.price + spread).toFixed(2);
        if (buyPriceEl) buyPriceEl.textContent = (priceData.price + spread).toFixed(2);
        if (sellPriceEl) sellPriceEl.textContent = (priceData.price - spread).toFixed(2);
        
        if (symbolChangeEl) {
            symbolChangeEl.textContent = `${priceData.changePercent >= 0 ? '+' : ''}${priceData.changePercent.toFixed(2)}%`;
            symbolChangeEl.className = `price-change ${priceData.changePercent >= 0 ? 'positive' : 'negative'}`;
        }
    }

    setupQuickActions() {
        const actions = {
            'depositBtn': () => window.location.href = 'deposit.html',
            'withdrawBtn': () => window.location.href = 'withdraw.html',
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
                const volumeInput = document.querySelector('.volume-input');
                if (volumeInput) volumeInput.value = volume;
                document.querySelectorAll('.volume-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
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
            'personalInfo': () => window.location.href = 'settings.html',
            'security': () => window.location.href = 'settings.html',
            'verification': () => showToast('Verification coming soon', 'info'),
            'notifications': () => window.location.href = 'settings.html',
            'language': () => showToast('Language settings coming soon', 'info'),
            'currency': () => showToast('Currency settings coming soon', 'info'),
            'help': () => showToast('Help center coming soon', 'info'),
            'contact': () => showToast('Contact support coming soon', 'info'),
            'terms': () => showToast('Terms & conditions coming soon', 'info'),
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
        // Show recent transactions as live payment feed
        const container = document.getElementById('live-activities-list');
        if (!container) return;
        
        const recentTransactions = this.transactions
            .filter(t => t.type === 'deposit' || t.type === 'withdrawal')
            .slice(0, 10);
        
        if (recentTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state">No recent payment activity</div>';
            return;
        }
        
        container.innerHTML = recentTransactions.map(transaction => `
            <div class="live-activity-item">
                <div class="activity-avatar">
                    <img src="https://images.pexels.com/photos/3777946/pexels-photo-3777946.jpeg?w=40&h=40&fit=crop&crop=face" alt="User">
                </div>
                <div class="activity-details">
                    <div class="activity-user">
                        <span class="user-name">${this.currentProfile.full_name}</span>
                        <span class="user-country">Your Activity</span>
                    </div>
                    <div class="activity-action">
                        <span class="action-type ${transaction.type}">${transaction.type}</span>
                        <span class="action-amount">${formatCurrency(transaction.amount)}</span>
                    </div>
                </div>
                <div class="activity-time">
                    ${getRelativeTime(new Date(transaction.created_at).getTime())}
                </div>
            </div>
        `).join('');
        
        // Update stats
        const totalDeposits = this.transactions
            .filter(t => t.type === 'deposit')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalWithdrawals = this.transactions
            .filter(t => t.type === 'withdrawal')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const totalDepositsEl = document.getElementById('total-deposits');
        const totalWithdrawalsEl = document.getElementById('total-withdrawals');
        
        if (totalDepositsEl) totalDepositsEl.textContent = formatCurrency(totalDeposits, 'USD', 0);
        if (totalWithdrawalsEl) totalWithdrawalsEl.textContent = formatCurrency(totalWithdrawals, 'USD', 0);
    }
    
    updateWatchlist() {
        const symbols = ['BTC/USD', 'ETH/USD', 'EUR/USD', 'GBP/USD', 'AAPL'];
        
        this.watchlist = symbols.map(symbol => {
            const priceData = realTimePrices.getPriceData(symbol);
            return {
                symbol,
                name: this.getSymbolName(symbol),
                price: priceData?.price || 0,
                change: priceData?.change || 0,
                changePercent: priceData?.changePercent || 0
            };
        });
        
        this.renderWatchlist();
    }
    
    getSymbolName(symbol) {
        const names = {
            'BTC/USD': 'Bitcoin',
            'ETH/USD': 'Ethereum',
            'EUR/USD': 'Euro / US Dollar',
            'GBP/USD': 'British Pound / US Dollar',
            'AAPL': 'Apple Inc.'
        };
        return names[symbol] || symbol;
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
        });

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
                this.updatePortfolioFromUser();
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
                    <div class="price">${item.price.toFixed(2)}</div>
                    <div class="price-change ${item.changePercent >= 0 ? 'positive' : 'negative'}">
                        ${item.changePercent >= 0 ? '+' : ''}${item.changePercent.toFixed(2)}%
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

        container.innerHTML = this.positions.map(position => {
            const currentPrice = realTimePrices.getCurrentPrice(position.symbol);
            const pnl = this.calculateTradePnL(position, currentPrice);
            const pnlPercent = (pnl / (position.entry_price * position.quantity)) * 100;
            
            return `
                <div class="position-item">
                    <div class="position-info">
                        <div class="position-symbol">${position.symbol} ${position.side.toUpperCase()}</div>
                        <div class="position-details">${position.quantity} • $${position.entry_price.toFixed(2)}</div>
                    </div>
                    <div class="position-pnl">
                        <div class="pnl-amount ${pnl >= 0 ? 'positive' : 'negative'}">
                            ${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toFixed(2)}
                        </div>
                        <div class="pnl-percentage">${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    calculateTradePnL(trade, currentPrice) {
        const priceDiff = trade.side === 'buy' 
            ? currentPrice - trade.entry_price 
            : trade.entry_price - currentPrice;
        
        return priceDiff * trade.quantity;
    }

    updateRecentActivity() {
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
                    <div class="activity-subtitle">${getRelativeTime(new Date(transaction.created_at).getTime())}</div>
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
        const container = document.getElementById('transactionsList');
        if (!container) return;

        if (this.transactions.length === 0) {
            container.innerHTML = '<div class="empty-state">No transactions found</div>';
            return;
        }

        container.innerHTML = this.transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fas fa-${this.getTransactionIcon(transaction.type)}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.note || transaction.type}</div>
                    <div class="transaction-subtitle">${getRelativeTime(new Date(transaction.created_at).getTime())} • ${transaction.status}</div>
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
                    <div class="notification-time">${getRelativeTime(new Date(notification.created_at).getTime())}</div>
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

        if (filteredTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state">No transactions found for this filter</div>';
            return;
        }

        container.innerHTML = filteredTransactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-icon ${transaction.type}">
                    <i class="fas fa-${this.getTransactionIcon(transaction.type)}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${transaction.note || transaction.type}</div>
                    <div class="transaction-subtitle">${getRelativeTime(new Date(transaction.created_at).getTime())} • ${transaction.status}</div>
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

    async executeTrade() {
        const orderType = document.querySelector('.order-btn.active');
        const volumeInput = document.querySelector('.volume-input');
        
        if (!orderType || !volumeInput) {
            showToast('Please select order type and volume', 'error');
            return;
        }

        const side = orderType.classList.contains('buy') ? 'buy' : 'sell';
        const quantity = parseFloat(volumeInput.value);
        const currentPrice = realTimePrices.getCurrentPrice(this.currentSymbol);

        if (!quantity || quantity <= 0) {
            showToast('Please enter a valid quantity', 'error');
            return;
        }

        // Check if user has sufficient balance
        const balances = this.currentProfile.balances || { USD: 0 };
        const tradeValue = quantity * currentPrice;
        
        if (side === 'buy' && tradeValue > balances.USD) {
            showToast('Insufficient USD balance', 'error');
            return;
        }

        try {
            showLoading(true);
            
            const trade = {
                user_id: this.currentUser.id,
                symbol: this.currentSymbol,
                side: side,
                quantity: quantity,
                entry_price: currentPrice,
                status: 'open',
                opened_at: new Date().toISOString()
            };

            const { data, error } = await apiClient.createTrade(trade);
            
            if (error) {
                throw new Error(error.message);
            }

            // Create transaction record
            const transaction = {
                user_id: this.currentUser.id,
                type: 'trade',
                amount: quantity * currentPrice,
                currency: 'USD',
                status: 'completed',
                note: `${side.toUpperCase()} ${quantity} ${this.currentSymbol} at $${currentPrice.toFixed(2)}`
            };

            await apiClient.createTransaction(transaction);

            // Update user balance
            const newBalances = { ...balances };
            if (side === 'buy') {
                newBalances.USD -= tradeValue;
            }
            
            await apiClient.updateUser(this.currentUser.id, { balances: newBalances });
            this.currentProfile.balances = newBalances;

            showToast(`${side.toUpperCase()} order executed successfully!`, 'success');
            
            // Reload data
            await this.loadUserData();
            this.updateUI();
            
        } catch (error) {
            console.error('Trade execution error:', error);
            showToast('Failed to execute trade', 'error');
        } finally {
            showLoading(false);
        }
    }

    showTransferModal() {
        showToast('Transfer feature coming soon', 'info');
    }

    async logout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                await authManager.logout();
                window.location.href = 'login.html';
            } catch (error) {
                console.error('Logout error:', error);
                showToast('Failed to logout', 'error');
            }
        }
    }

    startRealTimeUpdates() {
        // Start price engine
        realTimePrices.start();
        
        // Subscribe to price updates
        realTimePrices.subscribe('all', () => {
            this.updateUI();
            this.updateTradingPrices();
        });
        
        // Update UI periodically
        setInterval(() => {
            this.updateUI();
        }, 10000);
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