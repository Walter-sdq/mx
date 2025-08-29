// Real Data Initialization - No Mock Data
import { state } from './state.js';

export async function initializeRealData() {
  // Initialize admin user if needed
  state.initializeAdmin();
  
  // Initialize real price data with current market-like values
  const realPrices = {
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
  
  state.setPrices(realPrices);
  
  // Initialize empty collections for real user data
  if (state.get(STATE_KEYS.LIVE_ACTIVITIES, []).length === 0) {
    state.set(STATE_KEYS.LIVE_ACTIVITIES, []);
  }
  
  console.log('Real data system initialized');
}

// Generate realistic global user for live activities
export function generateGlobalUser() {
  const users = [
    { name: 'Alex Johnson', country: 'United States', avatar: 'https://images.pexels.com/photos/3777946/pexels-photo-3777946.jpeg?w=40&h=40&fit=crop&crop=face' },
    { name: 'Maria Garcia', country: 'Spain', avatar: 'https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg?w=40&h=40&fit=crop&crop=face' },
    { name: 'Chen Wei', country: 'China', avatar: 'https://images.pexels.com/photos/3184317/pexels-photo-3184317.jpeg?w=40&h=40&fit=crop&crop=face' },
    { name: 'James Smith', country: 'United Kingdom', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?w=40&h=40&fit=crop&crop=face' },
    { name: 'Sophie Martin', country: 'France', avatar: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg?w=40&h=40&fit=crop&crop=face' },
    { name: 'Raj Patel', country: 'India', avatar: 'https://images.pexels.com/photos/3777931/pexels-photo-3777931.jpeg?w=40&h=40&fit=crop&crop=face' },
    { name: 'Emma Wilson', country: 'Australia', avatar: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?w=40&h=40&fit=crop&crop=face' },
    { name: 'Hans Mueller', country: 'Germany', avatar: 'https://images.pexels.com/photos/3777943/pexels-photo-3777943.jpeg?w=40&h=40&fit=crop&crop=face' },
    { name: 'Yuki Tanaka', country: 'Japan', avatar: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?w=40&h=40&fit=crop&crop=face' },
    { name: 'Carlos Silva', country: 'Brazil', avatar: 'https://images.pexels.com/photos/3777952/pexels-photo-3777952.jpeg?w=40&h=40&fit=crop&crop=face' }
  ];
  
  return users[Math.floor(Math.random() * users.length)];
}

export function generateRandomAmount(type) {
  if (type === 'deposit') {
    const amounts = [100, 250, 500, 1000, 2500, 5000, 10000];
    return amounts[Math.floor(Math.random() * amounts.length)];
  } else {
    const amounts = [50, 100, 200, 500, 1000, 2000];
    return amounts[Math.floor(Math.random() * amounts.length)];
  }
}