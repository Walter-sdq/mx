// Configuration for data layer switching
export const DATA_LAYER = 'nedb'; // 'lokijs' | 'nedb'

// API Configuration
export const API_BASE_URL = '/api';

// Application Configuration
export const APP_CONFIG = {
  // Trading limits
  MIN_DEPOSIT: 10.00,
  MIN_WITHDRAW: 10.00,
  MIN_BTC_TRADE: 0.001,
  MIN_ETH_TRADE: 0.01,
  MIN_USD_TRADE: 10.00,
  
  // Fees
  TRADING_FEE_PERCENT: 0.3,
  WITHDRAWAL_FEE_USD: 2.50,
  
  // Pagination
  ITEMS_PER_PAGE: 20,
  
  // Chart settings
  CHART_UPDATE_INTERVAL: 2000, // 2 seconds
  PRICE_HISTORY_LENGTH: 500,
  
  // Animation settings
  ANIMATION_DURATION: 300,
  
  // Theme
  DEFAULT_THEME: 'dark',
  
  // Session
  SESSION_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  
  // Price simulation
  PRICE_VOLATILITY: 0.02, // 2% volatility
  PRICE_DRIFT: 0.001, // 0.1% drift
  
  // Market data
  SYMBOLS: {
    crypto: [
      { symbol: 'BTC/USD', name: 'Bitcoin', decimals: 2 },
      { symbol: 'ETH/USD', name: 'Ethereum', decimals: 2 },
      { symbol: 'LTC/USD', name: 'Litecoin', decimals: 2 },
      { symbol: 'XRP/USD', name: 'Ripple', decimals: 4 },
      { symbol: 'ADA/USD', name: 'Cardano', decimals: 4 },
      { symbol: 'DOT/USD', name: 'Polkadot', decimals: 2 },
    ],
    forex: [
      { symbol: 'EUR/USD', name: 'Euro / US Dollar', decimals: 5 },
      { symbol: 'GBP/USD', name: 'British Pound / US Dollar', decimals: 5 },
      { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', decimals: 3 },
      { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', decimals: 5 },
      { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', decimals: 5 },
      { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', decimals: 5 },
    ],
    stocks: [
      { symbol: 'AAPL', name: 'Apple Inc.', decimals: 2 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', decimals: 2 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', decimals: 2 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', decimals: 2 },
      { symbol: 'TSLA', name: 'Tesla Inc.', decimals: 2 },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', decimals: 2 },
    ]
  },
  
  // Initial prices for simulation
  INITIAL_PRICES: {
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
    'NVDA': 498.12,
  }
};

// Validation rules
export const VALIDATION = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol'
  },
  fullName: {
    minLength: 2,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Full name must contain only letters and spaces'
  }
};

// Toast notification settings
export const TOAST_CONFIG = {
  duration: 5000,
  position: 'bottom-right'
};

// Local storage keys
export const STORAGE_KEYS = {
  SESSION: 'maxprofit_session',
  THEME: 'maxprofit_theme',
  SETTINGS: 'maxprofit_settings',
  PRICES: 'maxprofit_prices',
  CHART_DATA: 'maxprofit_chart_data'
};