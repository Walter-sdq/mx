// Live Support System with Simulated Global Activity
import { state } from './state.js';
import { formatCurrency, getRelativeTime, generateId } from './utils.js';

export class LiveSupportManager {
  constructor() {
    this.activities = [];
    this.isRunning = false;
    this.updateInterval = null;
    
    this.globalUsers = [
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
    
    this.init();
  }
  
  init() {
    this.loadActivities();
    this.startSimulation();
  }
  
  loadActivities() {
    this.activities = state.get('maxprofit_live_activities', []);
    
    // Seed initial activities if empty
    if (this.activities.length === 0) {
      this.seedInitialActivities();
    }
    
    // Keep only last 50 activities
    this.activities = this.activities.slice(-50);
  }
  
  seedInitialActivities() {
    const now = Date.now();
    const activities = [];
    
    for (let i = 0; i < 20; i++) {
      const user = this.globalUsers[Math.floor(Math.random() * this.globalUsers.length)];
      const type = Math.random() > 0.5 ? 'deposit' : 'withdrawal';
      const amount = this.generateRandomAmount(type);
      
      activities.push({
        _id: generateId(),
        user: user,
        type: type,
        amount: amount,
        currency: 'USD',
        timestamp: now - (i * 60000 * Math.random() * 30), // Last 30 minutes
        status: 'completed'
      });
    }
    
    this.activities = activities.sort((a, b) => b.timestamp - a.timestamp);
    state.set('maxprofit_live_activities', this.activities);
  }
  
  generateRandomAmount(type) {
    if (type === 'deposit') {
      const amounts = [100, 250, 500, 1000, 2500, 5000, 10000];
      return amounts[Math.floor(Math.random() * amounts.length)];
    } else {
      const amounts = [50, 100, 200, 500, 1000, 2000];
      return amounts[Math.floor(Math.random() * amounts.length)];
    }
  }
  
  startSimulation() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.generateNewActivity();
    }, 15000 + Math.random() * 30000); // Every 15-45 seconds
  }
  
  stopSimulation() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  generateNewActivity() {
    const user = this.globalUsers[Math.floor(Math.random() * this.globalUsers.length)];
    const type = Math.random() > 0.6 ? 'deposit' : 'withdrawal';
    const amount = this.generateRandomAmount(type);
    
    const activity = {
      _id: generateId(),
      user: user,
      type: type,
      amount: amount,
      currency: 'USD',
      timestamp: Date.now(),
      status: 'completed'
    };
    
    this.activities.unshift(activity);
    
    // Keep only last 50 activities
    if (this.activities.length > 50) {
      this.activities = this.activities.slice(0, 50);
    }
    
    state.set('maxprofit_live_activities', this.activities);
    
    // Trigger UI update
    this.renderActivities();
    
    // Show notification for new activity
    this.showActivityNotification(activity);
  }
  
  renderActivities() {
    const container = document.getElementById('live-activities-list');
    if (!container) return;
    
    container.innerHTML = this.activities.map(activity => `
      <div class="live-activity-item">
        <div class="activity-avatar">
          <img src="${activity.user.avatar}" alt="${activity.user.name}">
          <div class="activity-flag">
            <i class="fas fa-globe"></i>
          </div>
        </div>
        <div class="activity-details">
          <div class="activity-user">
            <span class="user-name">${activity.user.name}</span>
            <span class="user-country">${activity.user.country}</span>
          </div>
          <div class="activity-action">
            <span class="action-type ${activity.type}">${activity.type === 'deposit' ? 'deposited' : 'withdrew'}</span>
            <span class="action-amount">${formatCurrency(activity.amount)}</span>
          </div>
        </div>
        <div class="activity-time">
          ${getRelativeTime(activity.timestamp)}
        </div>
      </div>
    `).join('');
  }
  
  showActivityNotification(activity) {
    // Only show if user is on live support page
    const livePage = document.getElementById('live-support-page');
    if (!livePage || !livePage.classList.contains('active')) return;
    
    const notification = document.createElement('div');
    notification.className = 'live-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <img src="${activity.user.avatar}" alt="${activity.user.name}">
        <span>${activity.user.name} just ${activity.type === 'deposit' ? 'deposited' : 'withdrew'} ${formatCurrency(activity.amount)}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  getActivities() {
    return this.activities;
  }
  
  getTotalStats() {
    const deposits = this.activities.filter(a => a.type === 'deposit');
    const withdrawals = this.activities.filter(a => a.type === 'withdrawal');
    
    return {
      totalDeposits: deposits.reduce((sum, a) => sum + a.amount, 0),
      totalWithdrawals: withdrawals.reduce((sum, a) => sum + a.amount, 0),
      depositCount: deposits.length,
      withdrawalCount: withdrawals.length,
      activeUsers: new Set(this.activities.map(a => a.user.name)).size
    };
  }
}

// Global instance
export const liveSupportManager = new LiveSupportManager();