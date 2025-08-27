// LokiJS Database Implementation
import { generateId } from './utils.js';

let db = null;
let collections = {};
let isInitialized = false;

// Initialize LokiJS database
export async function initDB() {
  if (isInitialized) return db;
  
  try {
    // Import LokiJS
    const { default: Loki } = await import('https://cdn.skypack.dev/lokijs');
    
    db = new Loki('maxprofit.db', {
      adapter: new Loki.LokiIndexedAdapter(),
      autoload: true,
      autoloadCallback: initializeCollections,
      autosave: true,
      autosaveInterval: 4000
    });
    
    return new Promise((resolve) => {
      function initializeCollections() {
        // Users collection
        collections.users = db.getCollection('users') || db.addCollection('users', {
          unique: ['email'],
          indices: ['email', 'role', 'createdAt']
        });
        
        // Transactions collection
        collections.transactions = db.getCollection('transactions') || db.addCollection('transactions', {
          indices: ['userId', 'type', 'status', 'createdAt']
        });
        
        // Trades collection
        collections.trades = db.getCollection('trades') || db.addCollection('trades', {
          indices: ['userId', 'symbol', 'status', 'openedAt']
        });
        
        // Withdrawals collection
        collections.withdrawals = db.getCollection('withdrawals') || db.addCollection('withdrawals', {
          indices: ['userId', 'status', 'createdAt']
        });
        
        // Notifications collection
        collections.notifications = db.getCollection('notifications') || db.addCollection('notifications', {
          indices: ['toUserId', 'read', 'createdAt']
        });
        
        // Seed data if empty
        seedDataIfEmpty();
        
        isInitialized = true;
        resolve(db);
      }
    });
  } catch (error) {
    console.error('Failed to initialize LokiJS:', error);
    throw error;
  }
}

// Seed initial data
function seedDataIfEmpty() {
  // Seed admin user
  if (collections.users.count() === 0) {
    const adminUser = {
      _id: generateId(),
      email: 'admin@maxprofit.dev',
      passwordHash: hashPassword('Admin@1234'), // Simple hash for demo
      fullName: 'Admin User',
      role: 'admin',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      settings: {
        darkMode: true,
        notifications: true,
        biometric: false
      },
      balances: {
        USD: 100000.00,
        BTC: 2.5,
        ETH: 10.0
      }
    };
    
    const sarahUser = {
      _id: generateId(),
      email: 'sarah@maxprofit.dev',
      passwordHash: hashPassword('User@1234'),
      fullName: 'Sarah Chen',
      role: 'user',
      createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000), // 30 days ago
      lastLoginAt: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
      settings: {
        darkMode: true,
        notifications: true,
        biometric: true
      },
      balances: {
        USD: 15430.25,
        BTC: 0.21340580,
        ETH: 3.45672100
      }
    };
    
    const marcusUser = {
      _id: generateId(),
      email: 'marcus@maxprofit.dev',
      passwordHash: hashPassword('User@1234'),
      fullName: 'Marcus Rodriguez',
      role: 'user',
      createdAt: Date.now() - (45 * 24 * 60 * 60 * 1000), // 45 days ago
      lastLoginAt: Date.now() - (1 * 24 * 60 * 60 * 1000), // 1 day ago
      settings: {
        darkMode: false,
        notifications: true,
        biometric: false
      },
      balances: {
        USD: 8750.50,
        BTC: 0.15672340,
        ETH: 2.87543210
      }
    };
    
    collections.users.insert([adminUser, sarahUser, marcusUser]);
    
    // Seed transactions for Sarah
    const transactions = [
      {
        _id: generateId(),
        userId: sarahUser._id,
        type: 'deposit',
        amount: 5000.00,
        currency: 'USD',
        status: 'completed',
        note: 'Initial deposit',
        createdAt: Date.now() - (25 * 24 * 60 * 60 * 1000),
        meta: { method: 'bank' }
      },
      {
        _id: generateId(),
        userId: sarahUser._id,
        type: 'trade',
        amount: 0.1,
        currency: 'BTC',
        status: 'completed',
        note: 'Bought BTC',
        createdAt: Date.now() - (20 * 24 * 60 * 60 * 1000),
        meta: { side: 'buy', price: 41500.00 }
      },
      {
        _id: generateId(),
        userId: sarahUser._id,
        type: 'interest',
        amount: 127.45,
        currency: 'USD',
        status: 'completed',
        note: 'Monthly interest payment',
        createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000)
      },
      {
        _id: generateId(),
        userId: sarahUser._id,
        type: 'bonus',
        amount: 50.00,
        currency: 'USD',
        status: 'completed',
        note: 'Welcome bonus',
        createdAt: Date.now() - (3 * 24 * 60 * 60 * 1000)
      }
    ];
    
    
    collections.transactions.insert(transactions);
    
    // Seed some trades
    const trades = [
      {
        _id: generateId(),
        userId: sarahUser._id,
        symbol: 'BTC/USD',
        side: 'buy',
        qty: 0.05,
        entryPrice: 42100.00,
        status: 'open',
        openedAt: Date.now() - (2 * 24 * 60 * 60 * 1000)
      },
      {
        _id: generateId(),
        userId: sarahUser._id,
        symbol: 'ETH/USD',
        side: 'buy',
        qty: 1.5,
        entryPrice: 2520.00,
        status: 'open',
        openedAt: Date.now() - (1 * 24 * 60 * 60 * 1000)
      }
    ];
    
    collections.trades.insert(trades);
    
    // Seed notifications
    const notifications = [
      {
        _id: generateId(),
        toUserId: sarahUser._id,
        title: 'Welcome to MaxProfit!',
        body: 'Your account has been successfully created. Start trading now!',
        read: false,
        createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000)
      },
      {
        _id: generateId(),
        toUserId: sarahUser._id,
        title: 'Trade Executed',
        body: 'Your BTC buy order has been executed at $42,100.00',
        read: false,
        createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000)
      },
      {
        _id: generateId(),
        toUserId: sarahUser._id,
        title: 'Interest Payment',
        body: 'You received $127.45 in interest payments',
        read: true,
        createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000)
      }
    ];
    
    collections.notifications.insert(notifications);
    
    // Seed withdrawal requests
    const withdrawals = [
      {
        _id: generateId(),
        userId: sarahUser._id,
        amount: 1000.00,
        currency: 'USD',
        method: 'bank',
        addressOrAccount: '****1234',
        status: 'pending',
        createdAt: Date.now() - (1 * 24 * 60 * 60 * 1000)
      }
    ];
    
    collections.withdrawals.insert(withdrawals);
  }
}

// Simple password hashing (for demo purposes only)
function hashPassword(password) {
  // In production, use proper password hashing like bcrypt
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

// Database operations
export const DB = {
  // User operations
  async createUser(userData) {
    await initDB();
    
    try {
      const existingUser = collections.users.findOne({ email: userData.email.toLowerCase() });
      if (existingUser) {
        return { success: false, message: 'Email already exists' };
      }
      
      const user = {
        _id: generateId(),
        email: userData.email.toLowerCase(),
        passwordHash: hashPassword(userData.password),
        fullName: userData.fullName,
        role: userData.role || 'user',
        createdAt: Date.now(),
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
      
      const result = collections.users.insert(user);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
  
  async authenticateUser(email, password) {
    await initDB();
    
    const user = collections.users.findOne({ email: email.toLowerCase() });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { success: false, message: 'Invalid email or password' };
    }
    
    // Update last login
    user.lastLoginAt = Date.now();
    collections.users.update(user);
    
    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword };
  },
  
  async getUserById(userId) {
    await initDB();
    
    const user = collections.users.findOne({ _id: userId });
    if (!user) return { success: false, message: 'User not found' };
    
    const { passwordHash, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword };
  },
  
  async updateUser(userId, updates) {
    await initDB();
    
    const user = collections.users.findOne({ _id: userId });
    if (!user) return { success: false, message: 'User not found' };
    
    Object.assign(user, updates);
    collections.users.update(user);
    
    const { passwordHash, ...userWithoutPassword } = user;
    return { success: true, data: userWithoutPassword };
  },
  
  async getAllUsers() {
    await initDB();
    
    const users = collections.users.find({});
    return { 
      success: true, 
      data: users.map(({ passwordHash, ...user }) => user) 
    };
  },
  
  async deleteUser(userId) {
    await initDB();
    
    const user = collections.users.findOne({ _id: userId });
    if (!user) return { success: false, message: 'User not found' };
    
    collections.users.remove(user);
    return { success: true };
  },
  
  // Transaction operations
  async createTransaction(transactionData) {
    await initDB();
    
    const transaction = {
      _id: generateId(),
      ...transactionData,
      createdAt: Date.now()
    };
    
    const result = collections.transactions.insert(transaction);
    return { success: true, data: result };
  },
  
  async getTransactions(filters = {}) {
    await initDB();
    
    let query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    
    const transactions = collections.transactions.find(query);
    return { success: true, data: transactions };
  },
  
  async updateTransaction(transactionId, updates) {
    await initDB();
    
    const transaction = collections.transactions.findOne({ _id: transactionId });
    if (!transaction) return { success: false, message: 'Transaction not found' };
    
    Object.assign(transaction, updates);
    collections.transactions.update(transaction);
    
    return { success: true, data: transaction };
  },
  
  // Trade operations
  async createTrade(tradeData) {
    await initDB();
    
    const trade = {
      _id: generateId(),
      ...tradeData,
      openedAt: Date.now(),
      status: 'open'
    };
    
    const result = collections.trades.insert(trade);
    return { success: true, data: result };
  },
  
  async getTrades(filters = {}) {
    await initDB();
    
    let query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.status) query.status = filters.status;
    if (filters.symbol) query.symbol = filters.symbol;
    
    const trades = collections.trades.find(query);
    return { success: true, data: trades };
  },
  
  async updateTrade(tradeId, updates) {
    await initDB();
    
    const trade = collections.trades.findOne({ _id: tradeId });
    if (!trade) return { success: false, message: 'Trade not found' };
    
    Object.assign(trade, updates);
    if (updates.status === 'closed' && !trade.closedAt) {
      trade.closedAt = Date.now();
    }
    
    collections.trades.update(trade);
    return { success: true, data: trade };
  },
  
  async deleteTrade(tradeId) {
    await initDB();
    
    const trade = collections.trades.findOne({ _id: tradeId });
    if (!trade) return { success: false, message: 'Trade not found' };
    
    collections.trades.remove(trade);
    return { success: true };
  },
  
  // Withdrawal operations
  async createWithdrawal(withdrawalData) {
    await initDB();
    
    const withdrawal = {
      _id: generateId(),
      ...withdrawalData,
      status: 'pending',
      createdAt: Date.now()
    };
    
    const result = collections.withdrawals.insert(withdrawal);
    return { success: true, data: result };
  },
  
  async getWithdrawals(filters = {}) {
    await initDB();
    
    let query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.status) query.status = filters.status;
    
    const withdrawals = collections.withdrawals.find(query);
    return { success: true, data: withdrawals };
  },
  
  async updateWithdrawal(withdrawalId, updates) {
    await initDB();
    
    const withdrawal = collections.withdrawals.findOne({ _id: withdrawalId });
    if (!withdrawal) return { success: false, message: 'Withdrawal not found' };
    
    Object.assign(withdrawal, updates);
    withdrawal.updatedAt = Date.now();
    
    collections.withdrawals.update(withdrawal);
    return { success: true, data: withdrawal };
  },
  
  // Notification operations
  async createNotification(notificationData) {
    await initDB();
    
    const notification = {
      _id: generateId(),
      ...notificationData,
      read: false,
      createdAt: Date.now()
    };
    
    const result = collections.notifications.insert(notification);
    return { success: true, data: result };
  },
  
  async getNotifications(filters = {}) {
    await initDB();
    
    let query = {};
    if (filters.toUserId) query.toUserId = filters.toUserId;
    if (filters.read !== undefined) query.read = filters.read;
    
    const notifications = collections.notifications.find(query);
    return { success: true, data: notifications };
  },
  
  async updateNotification(notificationId, updates) {
    await initDB();
    
    const notification = collections.notifications.findOne({ _id: notificationId });
    if (!notification) return { success: false, message: 'Notification not found' };
    
    Object.assign(notification, updates);
    collections.notifications.update(notification);
    
    return { success: true, data: notification };
  },
  
  async markAllNotificationsRead(userId) {
    await initDB();
    
    const notifications = collections.notifications.find({ 
      toUserId: userId, 
      read: false 
    });
    
    notifications.forEach(notification => {
      notification.read = true;
      collections.notifications.update(notification);
    });
    
    return { success: true, data: notifications.length };
  }
};