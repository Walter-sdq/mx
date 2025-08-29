// Live Payment Feed System
import { generateGlobalUser, generateRandomAmount } from './mockData.js';
import { formatCurrency, getRelativeTime, generateId } from './utils.js';

export class LivePaymentManager {
  constructor() {
    this.activities = [];
    this.isRunning = false;
    this.updateInterval = null;
    
    this.init();
  }
  
  init() {
    this.loadActivities();
    this.startSimulation();
  }
  
  loadActivities() {
    this.activities = state.getLiveActivities();
    
    // Seed initial activities if empty
    if (this.activities.length === 0) {
      this.seedInitialActivities();
    }
  }
  
  seedInitialActivities() {
    const now = Date.now();
    const activities = [];
    
    for (let i = 0; i < 15; i++) {
      const user = generateGlobalUser();
      const type = Math.random() > 0.6 ? 'deposit' : 'withdrawal';
      const amount = generateRandomAmount(type);
      
      activities.push({
        _id: generateId(),
        user: user,
        type: type,
        amount: amount,
        currency: 'USD',
        timestamp: now - (i * 60000 * Math.random() * 20), // Last 20 minutes
        status: 'completed'
      });
    }
    
    this.activities = activities.sort((a, b) => b.timestamp - a.timestamp);
    state.set(STATE_KEYS.LIVE_ACTIVITIES, this.activities);
  }
  
  startSimulation() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.generateNewActivity();
    }, 8000 + Math.random() * 15000); // Every 8-23 seconds
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
    const user = generateGlobalUser();
    const type = Math.random() > 0.65 ? 'deposit' : 'withdrawal';
    const amount = generateRandomAmount(type);
    
    const activity = {
      _id: generateId(),
      user: user,
      type: type,
      amount: amount,
      currency: 'USD',
      timestamp: Date.now(),
      status: 'completed'
    };
    
    state.addLiveActivity(activity);
    this.activities = state.getLiveActivities();
    
    // Trigger UI update
    this.renderActivities();
    
    // Show notification for new activity
    this.showActivityNotification(activity);
  }
  
  renderActivities() {
    const container = document.getElementById('live-activities-list');
    if (!container) return;
    
    const activities = state.getLiveActivities();
    
    container.innerHTML = activities.map(activity => `
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
    // Only show if user is on live payment page
    const livePage = document.getElementById('supportPage');
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
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }
  
  getTotalStats() {
    const activities = state.getLiveActivities();
    const deposits = activities.filter(a => a.type === 'deposit');
    const withdrawals = activities.filter(a => a.type === 'withdrawal');
    
    return {
      totalDeposits: deposits.reduce((sum, a) => sum + a.amount, 0),
      totalWithdrawals: withdrawals.reduce((sum, a) => sum + a.amount, 0),
      depositCount: deposits.length,
      withdrawalCount: withdrawals.length,
      activeUsers: new Set(activities.map(a => a.user.name)).size
    };
  }
}

// Global instance
export const livePaymentManager = new LivePaymentManager();