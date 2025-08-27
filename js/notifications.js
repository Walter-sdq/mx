// Notification Management
import { state } from './state.js';
import { SessionManager } from './session.js';
import { showToast, formatDateTime, getRelativeTime } from './utils.js';

export class NotificationManager {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    
    this.init();
  }
  
  init() {
    this.loadNotifications();
    this.setupEventListeners();
    this.renderNotifications();
    this.updateBadges();
  }
  
  loadNotifications() {
    const session = SessionManager.getSession();
    if (!session) return;
    
    this.notifications = state.getNotifications(session.userId)
      .sort((a, b) => b.createdAt - a.createdAt);
    
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }
  
  setupEventListeners() {
    // Mark all as read button
    const markAllReadBtn = document.getElementById('mark-all-read');
    if (markAllReadBtn) {
      markAllReadBtn.addEventListener('click', () => {
        this.markAllAsRead();
      });
    }
    
    // Subscribe to new notifications
    state.subscribe('maxprofit_notifications', () => {
      this.loadNotifications();
      this.renderNotifications();
      this.updateBadges();
    });
  }
  
  renderNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container) return;
    
    if (this.notifications.length === 0) {
      container.innerHTML = `
        <div class="c-empty-state">
          <div class="empty-icon">
            <i class="fas fa-bell-slash"></i>
          </div>
          <h3>No notifications</h3>
          <p>You're all caught up! New notifications will appear here.</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = this.notifications.map(notification => `
      <div class="c-notification-item ${notification.read ? '' : 'unread'}" 
           data-id="${notification._id}"
           onclick="notificationManager.markAsRead('${notification._id}')">
        <div class="notification-icon ${notification.type || 'default'}">
          <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="notification-content">
          <div class="notification-header">
            <h4 class="notification-title">${notification.title}</h4>
            <span class="notification-time">${getRelativeTime(notification.createdAt)}</span>
          </div>
          <p class="notification-body">${notification.body}</p>
        </div>
        ${!notification.read ? '<div class="unread-indicator"></div>' : ''}
      </div>
    `).join('');
  }
  
  updateBadges() {
    const badges = document.querySelectorAll('.notification-badge');
    badges.forEach(badge => {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    });
  }
  
  markAsRead(notificationId) {
    const notification = this.notifications.find(n => n._id === notificationId);
    if (!notification || notification.read) return;
    
    state.updateNotification(notificationId, { read: true });
    
    // Update local data
    notification.read = true;
    this.unreadCount = Math.max(0, this.unreadCount - 1);
    
    this.renderNotifications();
    this.updateBadges();
  }
  
  markAllAsRead() {
    const session = SessionManager.getSession();
    if (!session) return;
    
    state.markAllNotificationsRead(session.userId);
    
    // Update local data
    this.notifications.forEach(n => n.read = true);
    this.unreadCount = 0;
    
    this.renderNotifications();
    this.updateBadges();
    
    showToast('All notifications marked as read', 'success');
  }
  
  addNotification(notification) {
    state.addNotification(notification);
    this.loadNotifications();
    this.renderNotifications();
    this.updateBadges();
  }
  
  getNotificationIcon(type) {
    const icons = {
      welcome: 'hand-wave',
      trade: 'chart-line',
      payment: 'dollar-sign',
      withdrawal: 'money-check-alt',
      system: 'cog',
      security: 'shield-alt',
      promotion: 'gift'
    };
    
    return icons[type] || 'bell';
  }
  
  getUnreadCount() {
    return this.unreadCount;
  }
  
  refresh() {
    this.loadNotifications();
    this.renderNotifications();
    this.updateBadges();
  }
}

// Global notification manager instance
let notificationManager;

// Initialize when needed
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('notifications-page') || document.querySelector('.notification-badge')) {
    notificationManager = new NotificationManager();
    window.notificationManager = notificationManager; // Make available for onclick handlers
  }
});

export { NotificationManager };