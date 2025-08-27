// Mock Data for Demo - Reset to Zero Balances

export async function initializeMockData(state) {
  // No hardcoded admin user. Only real users from Supabase Auth should be used.
  state.setUsers([]);
  
  // Initialize empty collections
  state.set('maxprofit_transactions', []);
  state.set('maxprofit_trades', []);
  state.set('maxprofit_withdrawals', []);
  state.set('maxprofit_notifications', []);
  state.set('maxprofit_verifications', []);
  state.set('maxprofit_live_activities', []);
  
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
  
  console.log('Mock data initialized with zero balances for new users');
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