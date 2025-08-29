// Application State Management
window.FEATURES = {
  USE_EXTERNAL_CHART_LIB: true,   // Chart.js vs vanilla
  MODE: "REAL_DATA" // Real data mode
};
window.STATE_KEYS = {
  USERS: 'maxprofit_users',
  TRANSACTIONS: 'maxprofit_transactions',
  TRADES: 'maxprofit_trades',
  WITHDRAWALS: 'maxprofit_withdrawals',
  NOTIFICATIONS: 'maxprofit_notifications',
  LIVE_ACTIVITIES: 'maxprofit_live_activities',
  PRICES: 'maxprofit_prices',
  SETTINGS: 'maxprofit_settings'
};

class StateManager {
  constructor() {
    this.subscribers = new Map();
    this.cache = new Map();
    this.prevState = new Map(); // Store previous state
  }

  // Save previous state before mutation
  savePrevState(key) {
    if (this.cache.has(key)) {
      this.prevState.set(key, JSON.parse(JSON.stringify(this.cache.get(key))));
    }
  }

  getPrevState(key) {
    return this.prevState.get(key);
  }
  
  // Generic state operations
  get(key, defaultValue = null) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const value = getStorageItem(key, defaultValue);
    this.cache.set(key, value);
    return value;
  }
  
  set(key, value) {
    this.savePrevState(key); // Save previous state
    this.cache.set(key, value);
    setStorageItem(key, value);
    this.notify(key, value);
  }
  
  update(key, updater) {
    this.savePrevState(key); // Save previous state
    const current = this.get(key, []);
    const updated = updater(current);
    this.set(key, updated);
    return updated;
  }
  
  // Subscription system
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    
    return () => {
      this.subscribers.get(key)?.delete(callback);
    };
  }
  
  notify(key, value) {
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error('State subscriber error:', error);
        }
      });
    }
  }
  
  // Entity-specific methods
  getUsers() {
    return this.get(STATE_KEYS.USERS, []);
  }
  
  setUsers(users) {
    this.set(STATE_KEYS.USERS, users);
  }
  
  addUser(user) {
    return this.update(STATE_KEYS.USERS, users => [...users, user]);
  }
  
  updateUser(userId, updates) {
    return this.update(STATE_KEYS.USERS, users => 
      users.map(user => user._id === userId ? { ...user, ...updates } : user)
    );
  }
  
  deleteUser(userId) {
    return this.update(STATE_KEYS.USERS, users => 
      users.filter(user => user._id !== userId)
    );
  }
  
  getUserById(userId) {
    const users = this.getUsers();
    return users.find(user => user._id === userId);
  }
  
  getUserByEmail(email) {
    const users = this.getUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  }
  
  // Create new user with zero balances
  createUser(userData) {
    const newUser = {
      _id: this.generateId(),
      email: userData.email.toLowerCase(),
      fullName: userData.fullName,
      role: userData.role || 'user',
      emailVerified: false,
      createdAt: Date.now(),
      lastLoginAt: null,
      settings: {
        darkMode: true,
        notifications: true,
        biometric: false
      },
      balances: {
        USD: 0.00,
        BTC: 0.00000000,
        ETH: 0.00000000
      }
    };
    
    this.addUser(newUser);
    return newUser;
  }
  
  getTransactions(userId = null) {
    const transactions = this.get(STATE_KEYS.TRANSACTIONS, []);
    return userId ? transactions.filter(t => t.userId === userId) : transactions;
  }
  
  addTransaction(transaction) {
    return this.update(STATE_KEYS.TRANSACTIONS, transactions => 
      [...transactions, { ...transaction, _id: transaction._id || this.generateId() }]
    );
  }
  
  getTrades(userId = null) {
    const trades = this.get(STATE_KEYS.TRADES, []);
    return userId ? trades.filter(t => t.userId === userId) : trades;
  }
  
  addTrade(trade) {
    return this.update(STATE_KEYS.TRADES, trades => 
      [...trades, { ...trade, _id: trade._id || this.generateId() }]
    );
  }
  
  updateTrade(tradeId, updates) {
    return this.update(STATE_KEYS.TRADES, trades => 
      trades.map(trade => trade._id === tradeId ? { ...trade, ...updates } : trade)
    );
  }
  
  deleteTrade(tradeId) {
    return this.update(STATE_KEYS.TRADES, trades => 
      trades.filter(trade => trade._id !== tradeId)
    );
  }
  
  getWithdrawals(userId = null) {
    const withdrawals = this.get(STATE_KEYS.WITHDRAWALS, []);
    return userId ? withdrawals.filter(w => w.userId === userId) : withdrawals;
  }
  
  addWithdrawal(withdrawal) {
    return this.update(STATE_KEYS.WITHDRAWALS, withdrawals => 
      [...withdrawals, { ...withdrawal, _id: withdrawal._id || this.generateId() }]
    );
  }
  
  updateWithdrawal(withdrawalId, updates) {
    return this.update(STATE_KEYS.WITHDRAWALS, withdrawals => 
      withdrawals.map(w => w._id === withdrawalId ? { ...w, ...updates } : w)
    );
  }
  
  getNotifications(userId = null) {
    const notifications = this.get(STATE_KEYS.NOTIFICATIONS, []);
    return userId ? notifications.filter(n => n.toUserId === userId || !n.toUserId) : notifications;
  }
  
  addNotification(notification) {
    return this.update(STATE_KEYS.NOTIFICATIONS, notifications => 
      [...notifications, { ...notification, _id: notification._id || this.generateId() }]
    );
  }
  
  updateNotification(notificationId, updates) {
    return this.update(STATE_KEYS.NOTIFICATIONS, notifications => 
      notifications.map(n => n._id === notificationId ? { ...n, ...updates } : n)
    );
  }
  
  markAllNotificationsRead(userId) {
    return this.update(STATE_KEYS.NOTIFICATIONS, notifications => 
      notifications.map(n => 
        (n.toUserId === userId || !n.toUserId) ? { ...n, read: true } : n
      )
    );
  }
  
  // Live activities for payment feed
  getLiveActivities() {
    return this.get(STATE_KEYS.LIVE_ACTIVITIES, []);
  }
  addLiveActivity(activity) {
    return this.update(STATE_KEYS.LIVE_ACTIVITIES, activities => {
      const newActivities = [...activities, { ...activity, _id: activity._id || this.generateId() }];
      // Keep only last 50 activities
      return newActivities.slice(-50);
    });
  }
  
  getPrices() {
    return this.get(STATE_KEYS.PRICES, {});
  }
  
  setPrices(prices) {
    this.set(STATE_KEYS.PRICES, prices);
  }
  
  getSettings() {
    return this.get(STATE_KEYS.SETTINGS, {
      darkMode: true,
      notifications: true,
      biometric: false
    });
  }
  
  updateSettings(updates) {
    return this.update(STATE_KEYS.SETTINGS, settings => ({ ...settings, ...updates }));
  }
  
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  // Initialize admin user if none exists
  initializeAdmin() {
    const users = this.getUsers();
    const adminExists = users.some(user => user.role === 'admin');
    
    if (!adminExists) {
      const adminUser = {
        _id: this.generateId(),
        email: 'admin@maxprofit.dev',
        fullName: 'System Administrator',
        role: 'admin',
        emailVerified: true,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        settings: {
          darkMode: true,
          notifications: true,
          biometric: false
        },
        balances: {
          USD: 1000000.00,
          BTC: 10.00000000,
          ETH: 50.00000000
        }
      };
      
      this.addUser(adminUser);
      console.log('Admin user initialized');
    }
  }
  
  // Clear all data (for testing)
  clearAll() {
    Object.values(STATE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      this.cache.delete(key);
    });
  }
}

// Global state instance
window.state = new StateManager();

// Initialize with mock data if empty
window.initializeState = function() {
  if (window.FEATURES.MODE === "REAL_DATA") {
    // Do not load mock data
    return;
  }
  if (window.state.getUsers().length === 0) {
    // Import and initialize mock data
    import('./mockData.js').then(({ initializeMockData }) => {
      initializeMockData(window.state);
    });
  }
};

// Auto-initialize on load
document.addEventListener('DOMContentLoaded', () => {
  window.initializeState();
});