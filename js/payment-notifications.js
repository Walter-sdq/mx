// Payment Notification System - Handles real-time payment alerts and notifications
// Provides toast notifications, email alerts, and customizable notification preferences

class PaymentNotificationManager {
  constructor() {
    this.notifications = new Map();
    this.notificationQueue = [];
    this.isProcessing = false;
    this.defaultDuration = 5000;
    this.maxNotifications = 5;

    // Notification types and their configurations
    this.notificationTypes = {
      success: {
        icon: 'fas fa-check-circle',
        className: 'notification-success',
        sound: 'success'
      },
      error: {
        icon: 'fas fa-exclamation-circle',
        className: 'notification-error',
        sound: 'error'
      },
      warning: {
        icon: 'fas fa-exclamation-triangle',
        className: 'notification-warning',
        sound: 'warning'
      },
      info: {
        icon: 'fas fa-info-circle',
        className: 'notification-info',
        sound: 'info'
      },
      payment: {
        icon: 'fas fa-credit-card',
        className: 'notification-payment',
        sound: 'payment'
      }
    };

    this.userPreferences = {
      toastEnabled: true,
      soundEnabled: true,
      emailEnabled: false,
      smsEnabled: false,
      pushEnabled: true,
      desktopEnabled: true
    };

    this.initializeNotificationSystem();
  }

  initializeNotificationSystem() {
    // Create notification container
    this.createNotificationContainer();

    // Load user preferences
    this.loadUserPreferences();

    // Set up event listeners
    this.setupEventListeners();

    // Request notification permissions
    this.requestNotificationPermissions();
  }

  createNotificationContainer() {
    if (document.getElementById('payment-notification-container')) {
      return;
    }

    const container = document.createElement('div');
    container.id = 'payment-notification-container';
    container.className = 'payment-notification-container';
    container.innerHTML = `
      <style>
        .payment-notification-container {
          position: fixed;
          top: 80px;
          right: 20px;
          z-index: 10000;
          pointer-events: none;
          max-width: 400px;
        }

        .payment-notification {
          background: var(--bg-secondary, #1a1a1a);
          border: 1px solid var(--border-secondary, #333);
          border-radius: 12px;
          padding: 16px 20px;
          margin-bottom: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transform: translateX(100%);
          opacity: 0;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          pointer-events: auto;
          position: relative;
          overflow: hidden;
        }

        .payment-notification.show {
          transform: translateX(0);
          opacity: 1;
        }

        .payment-notification.hide {
          transform: translateX(100%);
          opacity: 0;
          margin-bottom: 0;
          padding-top: 0;
          padding-bottom: 0;
        }

        .payment-notification.success {
          border-left: 4px solid #10b981;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, transparent 100%);
        }

        .payment-notification.error {
          border-left: 4px solid #ef4444;
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, transparent 100%);
        }

        .payment-notification.warning {
          border-left: 4px solid #f59e0b;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, transparent 100%);
        }

        .payment-notification.info {
          border-left: 4px solid #3b82f6;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%);
        }

        .payment-notification.payment {
          border-left: 4px solid #8b5cf6;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, transparent 100%);
        }

        .notification-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .notification-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .notification-title {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary, #fff);
          margin: 0;
        }

        .notification-message {
          font-size: 13px;
          color: var(--text-secondary, #888);
          line-height: 1.4;
          margin: 0;
        }

        .notification-close {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          color: var(--text-tertiary, #666);
          cursor: pointer;
          font-size: 14px;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .notification-close:hover {
          background: var(--bg-hover, #2a2a2a);
          color: var(--text-secondary, #888);
        }

        .notification-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: var(--primary-500, #3b82f6);
          transition: width linear;
        }

        .notification-timestamp {
          font-size: 11px;
          color: var(--text-tertiary, #666);
          margin-top: 8px;
          text-align: right;
        }

        @media (max-width: 768px) {
          .payment-notification-container {
            left: 20px;
            right: 20px;
            top: 20px;
            max-width: none;
          }

          .payment-notification {
            border-radius: 8px;
            padding: 14px 16px;
          }
        }
      </style>
    `;

    document.body.appendChild(container);
    this.container = container;
  }

  setupEventListeners() {
    // Listen for live payment engine events
    if (window.livePaymentEngine) {
      window.livePaymentEngine.on('notification', (notification) => {
        this.showNotification(notification);
      });

      window.livePaymentEngine.on('paymentStatusChanged', (data) => {
        this.handlePaymentStatusChange(data);
      });

      window.livePaymentEngine.on('paymentConfirmed', (payment) => {
        this.handlePaymentConfirmation(payment);
      });

      window.livePaymentEngine.on('paymentExpired', (payment) => {
        this.handlePaymentExpiration(payment);
      });
    }

    // Listen for global notification events
    document.addEventListener('showNotification', (e) => {
      this.showNotification(e.detail);
    });

    // Handle notification clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('.notification-close')) {
        const notification = e.target.closest('.payment-notification');
        this.hideNotification(notification);
      }
    });
  }

  requestNotificationPermissions() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
        this.userPreferences.desktopEnabled = permission === 'granted';
      });
    }
  }

  loadUserPreferences() {
    try {
      const saved = localStorage.getItem('payment-notification-preferences');
      if (saved) {
        this.userPreferences = { ...this.userPreferences, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }

  saveUserPreferences() {
    try {
      localStorage.setItem('payment-notification-preferences', JSON.stringify(this.userPreferences));
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  showNotification(notification) {
    if (!this.userPreferences.toastEnabled) {
      return;
    }

    const notificationData = {
      id: this.generateNotificationId(),
      type: notification.type || 'info',
      title: notification.title || 'Notification',
      message: notification.message || '',
      duration: notification.duration || this.defaultDuration,
      timestamp: Date.now(),
      ...notification
    };

    // Add to queue
    this.notificationQueue.push(notificationData);

    // Process queue
    if (!this.isProcessing) {
      this.processNotificationQueue();
    }
  }

  async processNotificationQueue() {
    if (this.notificationQueue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const notification = this.notificationQueue.shift();

    await this.displayNotification(notification);
    await this.wait(notification.duration);

    this.isProcessing = false;
    this.processNotificationQueue();
  }

  async displayNotification(notification) {
    const notificationElement = this.createNotificationElement(notification);
    this.container.appendChild(notificationElement);

    // Trigger show animation
    setTimeout(() => {
      notificationElement.classList.add('show');
    }, 100);

    // Play sound if enabled
    if (this.userPreferences.soundEnabled) {
      this.playNotificationSound(notification.type);
    }

    // Show desktop notification if enabled
    if (this.userPreferences.desktopEnabled && 'Notification' in window) {
      this.showDesktopNotification(notification);
    }

    // Start progress bar
    this.startProgressBar(notificationElement, notification.duration);

    // Auto-hide after duration
    setTimeout(() => {
      this.hideNotification(notificationElement);
    }, notification.duration);
  }

  createNotificationElement(notification) {
    const config = this.notificationTypes[notification.type] || this.notificationTypes.info;
    const element = document.createElement('div');
    element.className = `payment-notification ${config.className}`;
    element.dataset.id = notification.id;

    element.innerHTML = `
      <div class="notification-header">
        <i class="notification-icon ${config.icon}"></i>
        <h4 class="notification-title">${this.escapeHtml(notification.title)}</h4>
        <button class="notification-close" title="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <p class="notification-message">${this.escapeHtml(notification.message)}</p>
      <div class="notification-timestamp">${this.formatTimestamp(notification.timestamp)}</div>
      <div class="notification-progress"></div>
    `;

    return element;
  }

  startProgressBar(element, duration) {
    const progressBar = element.querySelector('.notification-progress');
    progressBar.style.width = '100%';

    setTimeout(() => {
      progressBar.style.width = '0%';
    }, 100);
  }

  hideNotification(element) {
    if (!element) return;

    element.classList.add('hide');
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, 300);
  }

  showDesktopNotification(notification) {
    if (Notification.permission !== 'granted') return;

    const config = this.notificationTypes[notification.type] || this.notificationTypes.info;
    const desktopNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/img/logo.svg',
      badge: '/img/logo.svg',
      tag: notification.id,
      requireInteraction: notification.type === 'payment'
    });

    desktopNotification.onclick = () => {
      window.focus();
      desktopNotification.close();
    };

    setTimeout(() => {
      desktopNotification.close();
    }, notification.duration);
  }

  playNotificationSound(type) {
    // Create audio context for notification sounds
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different notification types
      const frequencies = {
        success: 800,
        error: 400,
        warning: 600,
        info: 500,
        payment: 700
      };

      oscillator.frequency.setValueAtTime(frequencies[type] || 500, audioContext.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  handlePaymentStatusChange(data) {
    const { payment, oldStatus, newStatus } = data;

    let notification = {
      type: 'info',
      title: 'Payment Status Update',
      message: `${payment.currency} ${payment.amount} status changed from ${oldStatus} to ${newStatus}`,
      duration: 4000
    };

    // Customize notification based on status
    switch (newStatus) {
      case 'processing':
        notification.type = 'info';
        notification.title = 'Payment Processing';
        notification.message = `Your ${payment.currency} ${payment.amount} payment is being processed.`;
        break;

      case 'confirming':
        notification.type = 'info';
        notification.title = 'Payment Confirming';
        notification.message = `Your ${payment.currency} ${payment.amount} payment is confirming on the network.`;
        break;

      case 'confirmed':
        notification.type = 'success';
        notification.title = 'Payment Confirmed!';
        notification.message = `${payment.currency} ${payment.amount} has been successfully confirmed.`;
        break;

      case 'failed':
        notification.type = 'error';
        notification.title = 'Payment Failed';
        notification.message = `Your ${payment.currency} ${payment.amount} payment has failed. Please try again.`;
        break;

      case 'expired':
        notification.type = 'warning';
        notification.title = 'Payment Expired';
        notification.message = `Your ${payment.currency} ${payment.amount} payment has expired. Please try again.`;
        break;
    }

    this.showNotification(notification);
  }

  handlePaymentConfirmation(payment) {
    this.showNotification({
      type: 'success',
      title: 'Payment Confirmed!',
      message: `${payment.currency} ${payment.amount} has been confirmed and added to your balance.`,
      duration: 6000
    });

    // Trigger celebration effect
    this.triggerCelebrationEffect();
  }

  handlePaymentExpiration(payment) {
    this.showNotification({
      type: 'warning',
      title: 'Payment Expired',
      message: `Your ${payment.currency} ${payment.amount} payment has expired. Please try again.`,
      duration: 7000
    });
  }

  triggerCelebrationEffect() {
    // Create celebration animation
    const celebration = document.createElement('div');
    celebration.className = 'payment-celebration';
    celebration.innerHTML = `
      <style>
        .payment-celebration {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10001;
        }

        .celebration-particles {
          position: absolute;
          width: 100%;
          height: 100%;
        }

        .particle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #10b981;
          border-radius: 50%;
          animation: celebrate 2s ease-out forwards;
        }

        @keyframes celebrate {
          0% {
            transform: translateY(100vh) scale(0);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(1);
            opacity: 0;
          }
        }
      </style>
      <div class="celebration-particles" id="celebration-particles"></div>
    `;

    document.body.appendChild(celebration);

    // Create particles
    const particlesContainer = celebration.querySelector('#celebration-particles');
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.background = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'][Math.floor(Math.random() * 4)];
        particlesContainer.appendChild(particle);

        setTimeout(() => {
          particle.remove();
        }, 2000);
      }, i * 40);
    }

    // Remove celebration after animation
    setTimeout(() => {
      celebration.remove();
    }, 3000);
  }

  // Utility methods
  generateNotificationId() {
    return 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public API methods
  setUserPreferences(preferences) {
    this.userPreferences = { ...this.userPreferences, ...preferences };
    this.saveUserPreferences();
  }

  getUserPreferences() {
    return { ...this.userPreferences };
  }

  clearAllNotifications() {
    const notifications = this.container.querySelectorAll('.payment-notification');
    notifications.forEach(notification => {
      this.hideNotification(notification);
    });
  }

  getNotificationHistory() {
    return Array.from(this.notifications.values());
  }
}

// Global instance
export const paymentNotificationManager = new PaymentNotificationManager();

// Export for use in other modules
window.paymentNotificationManager = paymentNotificationManager;
