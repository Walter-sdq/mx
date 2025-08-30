// Price engine for realistic market simulation
// Remove import/export for browser compatibility
// import { APP_CONFIG } from './config.js';
// import { getStorageItem, setStorageItem } from './utils.js';

window.PriceEngine = class {
  constructor() {
    this.prices = { ...window.APP_CONFIG.INITIAL_PRICES };
    this.priceHistory = {};
    this.subscribers = new Map();
    this.isRunning = false;
    this.updateInterval = null;
    
    // Initialize price history
    this.initializePriceHistory();
    
    // Load saved prices
    this.loadSavedPrices();
  }
  
  initializePriceHistory() {
    Object.keys(this.prices).forEach(symbol => {
      this.priceHistory[symbol] = [];
      
      // Generate initial history (last 500 points)
      const basePrice = this.prices[symbol];
      let currentPrice = basePrice;
      
      for (let i = 499; i >= 0; i--) {
        const timestamp = Date.now() - (i * 60000); // 1 minute intervals
        const change = this.generatePriceChange(currentPrice);
        currentPrice = Math.max(currentPrice + change, currentPrice * 0.01); // Prevent negative prices
        
        this.priceHistory[symbol].push({
          timestamp,
          price: currentPrice,
          volume: this.generateVolume()
        });
      }
      
      // Update current price to last historical price
      this.prices[symbol] = currentPrice;
    });
  }
  
  loadSavedPrices() {
    const savedPrices = getStorageItem('maxprofit_prices');
    if (savedPrices) {
      this.prices = { ...this.prices, ...savedPrices };
    }
  }
  
  savePrices() {
    setStorageItem('maxprofit_prices', this.prices);
  }
  
  generatePriceChange(currentPrice) {
    const { PRICE_VOLATILITY, PRICE_DRIFT } = APP_CONFIG;
    
    // Random walk with drift
    const randomComponent = (Math.random() - 0.5) * 2; // -1 to 1
    const volatility = currentPrice * PRICE_VOLATILITY * randomComponent;
    const drift = currentPrice * PRICE_DRIFT * (Math.random() - 0.4); // Slight upward bias
    
    return volatility + drift;
  }
  
  generateVolume() {
    // Generate realistic volume (in millions)
    return Math.random() * 100 + 10;
  }
  
  updatePrices() {
    const now = Date.now();
    
    Object.keys(this.prices).forEach(symbol => {
      const currentPrice = this.prices[symbol];
      const change = this.generatePriceChange(currentPrice);
      const newPrice = Math.max(currentPrice + change, currentPrice * 0.01);
      
      this.prices[symbol] = newPrice;
      
      // Add to history
      const historyEntry = {
        timestamp: now,
        price: newPrice,
        volume: this.generateVolume()
      };
      
      this.priceHistory[symbol].push(historyEntry);
      
      // Keep only last 500 entries
      if (this.priceHistory[symbol].length > 500) {
        this.priceHistory[symbol].shift();
      }
      
      // Notify subscribers
      this.notifySubscribers(symbol, {
        symbol,
        price: newPrice,
        change: change,
        changePercent: (change / currentPrice) * 100,
        timestamp: now,
        volume: historyEntry.volume
      });
    });
    
    // Save prices periodically
    this.savePrices();
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.updatePrices();
    }, APP_CONFIG.CHART_UPDATE_INTERVAL);
    
    console.log('Price engine started');
  }
  
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('Price engine stopped');
  }
  
  subscribe(symbol, callback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    
    this.subscribers.get(symbol).add(callback);
    
    // Send current price immediately
    const currentPrice = this.prices[symbol];
    if (currentPrice) {
      callback({
        symbol,
        price: currentPrice,
        change: 0,
        changePercent: 0,
        timestamp: Date.now(),
        volume: this.generateVolume()
      });
    }
    
    return () => {
      this.unsubscribe(symbol, callback);
    };
  }
  
  unsubscribe(symbol, callback) {
    if (this.subscribers.has(symbol)) {
      this.subscribers.get(symbol).delete(callback);
    }
  }
  
  notifySubscribers(symbol, data) {
    if (this.subscribers.has(symbol)) {
      this.subscribers.get(symbol).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in price subscriber:', error);
        }
      });
    }
    
    // Notify 'all' subscribers
    if (this.subscribers.has('all')) {
      this.subscribers.get('all').forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in price subscriber:', error);
        }
      });
    }
  }
  
  getCurrentPrice(symbol) {
    return this.prices[symbol] || 0;
  }
  
  getAllPrices() {
    return { ...this.prices };
  }
  
  getPriceHistory(symbol, timeframe = '1H') {
    if (!this.priceHistory[symbol]) return [];
    
    const now = Date.now();
    const timeframes = {
      '1H': 60 * 60 * 1000,
      '4H': 4 * 60 * 60 * 1000,
      '1D': 24 * 60 * 60 * 1000,
      '1W': 7 * 24 * 60 * 60 * 1000
    };
    
    const duration = timeframes[timeframe] || timeframes['1H'];
    const cutoff = now - duration;
    
    return this.priceHistory[symbol].filter(entry => entry.timestamp >= cutoff);
  }
  
  getMarketStats(symbol) {
    const history = this.getPriceHistory(symbol, '1D');
    if (history.length === 0) return null;
    
    const prices = history.map(h => h.price);
    const volumes = history.map(h => h.volume);
    
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const volume = volumes.reduce((sum, v) => sum + v, 0);
    const open = history[0].price;
    const close = prices[prices.length - 1];
    const change = close - open;
    const changePercent = (change / open) * 100;
    
    return {
      symbol,
      open,
      high,
      low,
      close,
      volume,
      change,
      changePercent
    };
  }
  
  // Simulate external market data fetch (optional)
  async fetchExternalData(symbol) {
    // This would integrate with real market data APIs
    // For demo, we'll just return simulated data
    return {
      symbol,
      price: this.getCurrentPrice(symbol),
      timestamp: Date.now()
    };
  }
}

// Create global price engine instance
export const priceEngine = new PriceEngine();

// Auto-start when page is visible
document.addEventListener('DOMContentLoaded', () => {
  priceEngine.start();
});

// Pause when page is hidden to save resources
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    priceEngine.stop();
  } else {
    priceEngine.start();
  }
});

// Stop when page unloads
window.addEventListener('beforeunload', () => {
  priceEngine.stop();
});

// Export utility functions
export function formatPrice(price, decimals = 2) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(price);
}

export function formatPriceChange(change, changePercent) {
  const sign = change >= 0 ? '+' : '';
  const formattedChange = formatPrice(Math.abs(change));
  const formattedPercent = Math.abs(changePercent).toFixed(2);
  
  return {
    change: `${sign}$${formattedChange}`,
    percent: `${sign}${formattedPercent}%`,
    isPositive: change >= 0
  };
}

export function getSymbolInfo(symbol) {
  const allSymbols = [
    ...APP_CONFIG.SYMBOLS.crypto,
    ...APP_CONFIG.SYMBOLS.forex,
    ...APP_CONFIG.SYMBOLS.stocks
  ];
  
  return allSymbols.find(s => s.symbol === symbol);
}