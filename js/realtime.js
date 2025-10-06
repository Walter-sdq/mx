// Real-time price data using external APIs and Supabase
import { apiClient } from './api.js';

class RealTimePriceEngine {
  constructor() {
    this.prices = new Map();
    this.subscribers = new Map();
    this.isRunning = false;
    this.updateInterval = null;
    
    // Initialize with base prices
    this.initializePrices();
  }
  
  initializePrices() {
    // Set initial prices from known market values
    const initialPrices = {
      'BTC/USD': 43250.00,
      'ETH/USD': 2580.00,
      'LTC/USD': 78.50,
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
    
    Object.entries(initialPrices).forEach(([symbol, price]) => {
      this.prices.set(symbol, {
        price,
        change: 0,
        changePercent: 0,
        timestamp: Date.now(),
        volume: Math.random() * 1000000
      });
    });
  }
  
  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // Load prices from Supabase first
    await this.loadPricesFromDB();
    
    // Start price updates using external APIs
    this.updateInterval = setInterval(() => {
      this.updatePricesFromAPI();
    }, 30000); // Update every 30 seconds
    
    console.log('Real-time price engine started');
  }
  
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('Real-time price engine stopped');
  }
  
  async loadPricesFromDB() {
    try {
      const { data: prices } = await apiClient.getPrices();
      
      if (prices && prices.length > 0) {
        prices.forEach(priceData => {
          this.prices.set(priceData.symbol, {
            price: priceData.price,
            change: priceData.change_24h || 0,
            changePercent: priceData.change_percent_24h || 0,
            timestamp: new Date(priceData.updated_at).getTime(),
            volume: priceData.volume_24h || 0
          });
        });
      }
    } catch (error) {
      console.error('Failed to load prices from database:', error);
    }
  }
  
  async updatePricesFromAPI() {
    try {
      // Fetch crypto prices from CoinGecko API
      await this.fetchCryptoPrices();
      
      // Simulate forex and stock prices for demo
      await this.simulateForexPrices();
      await this.simulateStockPrices();
      
    } catch (error) {
      console.error('Price update error:', error);
    }
  }
  
  async fetchCryptoPrices() {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,litecoin,ripple,cardano,polkadot&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch crypto prices');
      }
      
      const data = await response.json();
      const now = Date.now();
      
      const mapping = {
        'bitcoin': 'BTC/USD',
        'ethereum': 'ETH/USD',
        'litecoin': 'LTC/USD',
        'ripple': 'XRP/USD',
        'cardano': 'ADA/USD',
        'polkadot': 'DOT/USD'
      };
      
      for (const [coinId, symbol] of Object.entries(mapping)) {
        if (data[coinId]) {
          const price = data[coinId].usd;
          const changePercent = data[coinId].usd_24h_change || 0;
          const volume = data[coinId].usd_24h_vol || 0;
          const previousPrice = this.prices.get(symbol)?.price || price;
          const change = price - previousPrice;
          
          const priceData = {
            price,
            change,
            changePercent,
            timestamp: now,
            volume
          };
          
          this.updatePrice(symbol, priceData);
          
          // Save to Supabase
          await apiClient.updatePrice(symbol, priceData);
        }
      }
      
    } catch (error) {
      console.error('Crypto price fetch error:', error);
      // Fallback to simulation
      this.simulatePriceUpdates(['BTC/USD', 'ETH/USD', 'LTC/USD', 'XRP/USD', 'ADA/USD', 'DOT/USD']);
    }
  }
  
  async simulateForexPrices() {
    this.simulatePriceUpdates(['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'USD/CHF']);
  }
  
  async simulateStockPrices() {
    this.simulatePriceUpdates(['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA']);
  }
  
  simulatePriceUpdates(symbols) {
    const now = Date.now();
    
    symbols.forEach(async (symbol) => {
      const current = this.prices.get(symbol);
      if (!current) return;
      
      // Generate realistic price movement
      const volatility = 0.001; // 0.1% volatility
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const newPrice = current.price * (1 + randomChange);
      const change = newPrice - current.price;
      const changePercent = (change / current.price) * 100;
      
      const priceData = {
        price: newPrice,
        change,
        changePercent,
        timestamp: now,
        volume: Math.random() * 1000000
      };
      
      this.updatePrice(symbol, priceData);
      
      // Save to Supabase
      try {
        await apiClient.updatePrice(symbol, priceData);
      } catch (error) {
        console.error('Failed to save price to database:', error);
      }
    });
  }
  
  updatePrice(symbol, priceData) {
    this.prices.set(symbol, priceData);
    this.notifySubscribers(symbol, priceData);
  }
  
  subscribe(symbol, callback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }
    
    this.subscribers.get(symbol).add(callback);
    
    // Send current price immediately
    const currentPrice = this.prices.get(symbol);
    if (currentPrice) {
      callback({ symbol, ...currentPrice });
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
  
  notifySubscribers(symbol, priceData) {
    // Notify specific symbol subscribers
    if (this.subscribers.has(symbol)) {
      this.subscribers.get(symbol).forEach(callback => {
        try {
          callback({ symbol, ...priceData });
        } catch (error) {
          console.error('Price subscriber error:', error);
        }
      });
    }
    
    // Notify 'all' subscribers
    if (this.subscribers.has('all')) {
      this.subscribers.get('all').forEach(callback => {
        try {
          callback({ symbol, ...priceData });
        } catch (error) {
          console.error('Price subscriber error:', error);
        }
      });
    }
  }
  
  getCurrentPrice(symbol) {
    return this.prices.get(symbol)?.price || 0;
  }
  
  getAllPrices() {
    const result = {};
    this.prices.forEach((data, symbol) => {
      result[symbol] = data.price;
    });
    return result;
  }
  
  getPriceData(symbol) {
    return this.prices.get(symbol);
  }
}

export const realTimePrices = new RealTimePriceEngine();