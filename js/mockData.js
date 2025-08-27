// Mock Data for Demo
import { CryptoUtils } from './crypto.js';

export async function initializeMockData(state) {
  // Create admin user
  const adminPasswordHash = await CryptoUtils.hashPassword('Admin@1234');
  const adminUser = {
    _id: 'admin_001',
    email: 'admin@maxprofit.dev',
    passwordHash: adminPasswordHash,
    fullName: 'Admin User',
    role: 'admin',
    createdAt: Date.now() - (60 * 24 * 60 * 60 * 1000), // 60 days ago
    lastLoginAt: Date.now() - (1 * 60 * 60 * 1000), // 1 hour ago
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
  
  // Create Sarah Chen user
  const sarahPasswordHash = await CryptoUtils.hashPassword('User@1234');
  const sarahUser = {
    _id: 'user_001',
    email: 'sarah@maxprofit.dev',
    passwordHash: sarahPasswordHash,
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
  
  // Create Marcus Rodriguez user
  const marcusPasswordHash = await CryptoUtils.hashPassword('User@1234');
  const marcusUser = {
    _id: 'user_002',
    email: 'marcus@maxprofit.dev',
    passwordHash: marcusPasswordHash,
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
  
  // Set users
  state.setUsers([adminUser, sarahUser, marcusUser]);
  
  // Create sample transactions for Sarah
  const transactions = [
    {
      _id: 'tx_001',
      userId: 'user_001',
      type: 'deposit',
      amount: 5000.00,
      currency: 'USD',
      status: 'completed',
      note: 'Initial deposit via bank transfer',
      createdAt: Date.now() - (25 * 24 * 60 * 60 * 1000),
      meta: { method: 'bank', reference: 'DEP001' }
    },
    {
      _id: 'tx_002',
      userId: 'user_001',
      type: 'trade',
      amount: 0.1,
      currency: 'BTC',
      status: 'completed',
      note: 'BUY 0.1 BTC at $41,500.00',
      createdAt: Date.now() - (20 * 24 * 60 * 60 * 1000),
      meta: { side: 'buy', price: 41500.00, tradeId: 'trade_001' }
    },
    {
      _id: 'tx_003',
      userId: 'user_001',
      type: 'interest',
      amount: 127.45,
      currency: 'USD',
      status: 'completed',
      note: 'Monthly interest payment',
      createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'tx_004',
      userId: 'user_001',
      type: 'bonus',
      amount: 50.00,
      currency: 'USD',
      status: 'completed',
      note: 'Welcome bonus',
      createdAt: Date.now() - (3 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'tx_005',
      userId: 'user_001',
      type: 'withdraw',
      amount: 1000.00,
      currency: 'USD',
      status: 'pending',
      note: 'Withdrawal to bank account',
      createdAt: Date.now() - (1 * 24 * 60 * 60 * 1000),
      meta: { method: 'bank', account: '****1234' }
    }
  ];
  
  // Add transactions for Marcus
  const marcusTransactions = [
    {
      _id: 'tx_006',
      userId: 'user_002',
      type: 'deposit',
      amount: 3000.00,
      currency: 'USD',
      status: 'completed',
      note: 'Credit card deposit',
      createdAt: Date.now() - (40 * 24 * 60 * 60 * 1000),
      meta: { method: 'card', reference: 'DEP002' }
    },
    {
      _id: 'tx_007',
      userId: 'user_002',
      type: 'trade',
      amount: 2.0,
      currency: 'ETH',
      status: 'completed',
      note: 'BUY 2.0 ETH at $2,400.00',
      createdAt: Date.now() - (35 * 24 * 60 * 60 * 1000),
      meta: { side: 'buy', price: 2400.00, tradeId: 'trade_002' }
    }
  ];
  
  state.set(STATE_KEYS.TRANSACTIONS, [...transactions, ...marcusTransactions]);
  
  // Create sample trades
  const trades = [
    {
      _id: 'trade_001',
      userId: 'user_001',
      symbol: 'BTC/USD',
      side: 'buy',
      type: 'market',
      qty: 0.05,
      entryPrice: 42100.00,
      status: 'open',
      openedAt: Date.now() - (2 * 24 * 60 * 60 * 1000),
      stopLoss: 40000.00,
      takeProfit: 45000.00
    },
    {
      _id: 'trade_002',
      userId: 'user_001',
      symbol: 'ETH/USD',
      side: 'buy',
      type: 'limit',
      qty: 1.5,
      entryPrice: 2520.00,
      status: 'open',
      openedAt: Date.now() - (1 * 24 * 60 * 60 * 1000),
      takeProfit: 2800.00
    },
    {
      _id: 'trade_003',
      userId: 'user_002',
      symbol: 'BTC/USD',
      side: 'sell',
      type: 'market',
      qty: 0.02,
      entryPrice: 42500.00,
      status: 'closed',
      closePrice: 43200.00,
      pnl: 14.00,
      openedAt: Date.now() - (3 * 24 * 60 * 60 * 1000),
      closedAt: Date.now() - (2 * 24 * 60 * 60 * 1000)
    }
  ];
  
  state.set(STATE_KEYS.TRADES, trades);
  
  // Create sample withdrawals
  const withdrawals = [
    {
      _id: 'withdrawal_001',
      userId: 'user_001',
      amount: 1000.00,
      currency: 'USD',
      method: 'bank',
      addressOrAccount: '****1234',
      status: 'pending',
      createdAt: Date.now() - (1 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'withdrawal_002',
      userId: 'user_002',
      amount: 500.00,
      currency: 'USD',
      method: 'paypal',
      addressOrAccount: 'marcus@email.com',
      status: 'approved',
      adminNote: 'Verified and approved',
      approvedBy: 'admin_001',
      createdAt: Date.now() - (3 * 24 * 60 * 60 * 1000),
      updatedAt: Date.now() - (2 * 24 * 60 * 60 * 1000)
    }
  ];
  
  state.set(STATE_KEYS.WITHDRAWALS, withdrawals);
  
  // Create sample notifications
  const notifications = [
    {
      _id: 'notif_001',
      toUserId: 'user_001',
      title: 'Welcome to MaxProfit!',
      body: 'Your account has been successfully created. Start trading now to unlock your potential!',
      type: 'welcome',
      read: false,
      createdAt: Date.now() - (30 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'notif_002',
      toUserId: 'user_001',
      title: 'Trade Executed',
      body: 'Your BTC buy order has been executed at $42,100.00. Position is now open.',
      type: 'trade',
      read: false,
      createdAt: Date.now() - (2 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'notif_003',
      toUserId: 'user_001',
      title: 'Interest Payment Received',
      body: 'You received $127.45 in monthly interest payments. Keep up the great work!',
      type: 'payment',
      read: false,
      createdAt: Date.now() - (5 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'notif_004',
      toUserId: 'user_001',
      title: 'Withdrawal Request Submitted',
      body: 'Your withdrawal request for $1,000.00 is being processed. Expected completion: 1-3 business days.',
      type: 'withdrawal',
      read: true,
      createdAt: Date.now() - (1 * 24 * 60 * 60 * 1000)
    },
    {
      _id: 'notif_005',
      title: 'System Maintenance Complete',
      body: 'Scheduled maintenance has been completed. All services are now fully operational.',
      type: 'system',
      read: false,
      createdAt: Date.now() - (12 * 60 * 60 * 1000) // 12 hours ago
    }
  ];
  
  state.set(STATE_KEYS.NOTIFICATIONS, notifications);
  
  // Initialize price data
  const initialPrices = {
    'BTC/USD': 42850.00,
    'ETH/USD': 2540.00,
    'LTC/USD': 75.50,
    'XRP/USD': 0.6234,
    'ADA/USD': 0.4567,
    'DOT/USD': 12.34,
    'EUR/USD': 1.0856,
    'GBP/USD': 1.2734,
    'USD/JPY': 148.25,
    'AUD/USD': 0.6823,
    'USD/CAD': 1.3456,
    'USD/CHF': 0.8967,
    'AAPL': 185.23,
    'GOOGL': 142.56,
    'MSFT': 378.90,
    'AMZN': 153.45,
    'TSLA': 234.67,
    'NVDA': 498.12
  };
  
  state.setPrices(initialPrices);
  
  console.log('Mock data initialized successfully');
}

// Generate realistic trading data
export function generateRealisticTrade(userId, symbol) {
  const sides = ['buy', 'sell'];
  const types = ['market', 'limit'];
  const side = sides[Math.floor(Math.random() * sides.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  
  const basePrice = state.getPrices()[symbol] || 100;
  const entryPrice = basePrice + (Math.random() - 0.5) * basePrice * 0.02; // ±2% from current
  
  return {
    _id: state.generateId(),
    userId,
    symbol,
    side,
    type,
    qty: Math.random() * 2 + 0.01, // 0.01 to 2.01
    entryPrice: Math.round(entryPrice * 100) / 100,
    status: Math.random() > 0.3 ? 'open' : 'closed', // 70% open, 30% closed
    openedAt: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Last 30 days
    stopLoss: Math.random() > 0.5 ? entryPrice * (side === 'buy' ? 0.95 : 1.05) : null,
    takeProfit: Math.random() > 0.5 ? entryPrice * (side === 'buy' ? 1.1 : 0.9) : null
  };
}

// Generate sample price history
export function generatePriceHistory(symbol, days = 30) {
  const history = [];
  const basePrice = state.getPrices()[symbol] || 100;
  let currentPrice = basePrice;
  const now = Date.now();
  
  for (let i = days * 24; i >= 0; i--) {
    const timestamp = now - (i * 60 * 60 * 1000); // Hourly data
    
    // Random walk with slight upward bias
    const change = (Math.random() - 0.48) * currentPrice * 0.02; // Slight upward bias
    currentPrice = Math.max(currentPrice + change, currentPrice * 0.1); // Prevent negative
    
    history.push({
      timestamp,
      open: currentPrice,
      high: currentPrice * (1 + Math.random() * 0.01),
      low: currentPrice * (1 - Math.random() * 0.01),
      close: currentPrice,
      volume: Math.random() * 1000000 + 100000
    });
  }
  
  return history;
}

// Generate portfolio performance data
export function generatePortfolioHistory(userId, days = 30) {
  const user = state.getUserById(userId);
  if (!user) return [];
  
  const history = [];
  const { USD, BTC, ETH } = user.balances;
  const now = Date.now();
  
  // Calculate current total value
  const prices = state.getPrices();
  let totalValue = USD + (BTC * prices['BTC/USD']) + (ETH * prices['ETH/USD']);
  
  for (let i = days; i >= 0; i--) {
    const timestamp = now - (i * 24 * 60 * 60 * 1000); // Daily data
    
    // Simulate portfolio growth with some volatility
    const change = (Math.random() - 0.45) * totalValue * 0.03; // Slight upward bias
    totalValue = Math.max(totalValue + change, totalValue * 0.5);
    
    history.push({
      timestamp,
      value: Math.round(totalValue * 100) / 100
    });
  }
  
  return history;
}