// Live Payment System - Real-time Payment Tracking and Management
// Handles real-time payment status updates, live feeds, and payment analytics

class LivePaymentEngine {
  constructor() {
    this.activePayments = new Map();
    this.paymentSubscribers = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000;
    this.reconnectTimer = null;

    // Payment status definitions
    this.PAYMENT_STATUS = {
      PENDING: 'pending',
      PROCESSING: 'processing',
      CONFIRMING: 'confirming',
      CONFIRMED: 'confirmed',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
      EXPIRED: 'expired'
    };

    // Network confirmation requirements
    this.CONFIRMATION_REQUIREMENTS = {
      'bitcoin': 3,
      'ethereum': 12,
      'trc-20': 1,
      'erc-20': 12,
      'lightning': 0 // Instant
    };

    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Listen for new payment submissions
    document.addEventListener('paymentSubmitted', (e) => {
      this.trackPayment(e.detail);
    });

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseTracking();
      } else {
        this.resumeTracking();
      }
    });
  }

  async connect() {
    try {
      // Simulate WebSocket connection for real-time updates
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log('🔗 Live Payment Engine Connected');

      // Start payment tracking
      this.startPaymentTracking();

      // Emit connection event
      this.emit('connected', { timestamp: Date.now() });

    } catch (error) {
      console.error('Failed to connect live payment engine:', error);
      this.handleConnectionError();
    }
  }

  disconnect() {
    this.isConnected = false;
    this.stopPaymentTracking();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    console.log('🔌 Live Payment Engine Disconnected');
    this.emit('disconnected', { timestamp: Date.now() });
  }

  handleConnectionError() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('connectionFailed', { attempts: this.reconnectAttempts });
    }
  }

  trackPayment(paymentData) {
    const paymentId = this.generatePaymentId();
    const payment = {
      id: paymentId,
      ...paymentData,
      status: this.PAYMENT_STATUS.PENDING,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      confirmations: 0,
      requiredConfirmations: this.CONFIRMATION_REQUIREMENTS[paymentData.network] || 1,
      progress: 0,
      estimatedTime: this.estimateConfirmationTime(paymentData.network, paymentData.amount)
    };

    this.activePayments.set(paymentId, payment);
    this.emit('paymentTracked', payment);

    // Start monitoring this payment
    this.monitorPayment(payment);

    return paymentId;
  }

  monitorPayment(payment) {
    const monitoringInterval = setInterval(() => {
      if (!this.isConnected) {
        clearInterval(monitoringInterval);
        return;
      }

      this.updatePaymentStatus(payment);

      // Check if payment is complete
      if (this.isPaymentComplete(payment)) {
        clearInterval(monitoringInterval);
        this.finalizePayment(payment);
      }
    }, 30000); // Check every 30 seconds

    // Store interval reference for cleanup
    payment.monitoringInterval = monitoringInterval;
  }

  updatePaymentStatus(payment) {
    const now = Date.now();
    const elapsed = now - payment.createdAt;
    const progress = Math.min((elapsed / payment.estimatedTime) * 100, 95);

    // Simulate realistic payment progression
    let newStatus = payment.status;
    let confirmations = payment.confirmations;

    switch (payment.status) {
      case this.PAYMENT_STATUS.PENDING:
        if (elapsed > 30000) { // 30 seconds
          newStatus = this.PAYMENT_STATUS.PROCESSING;
        }
        break;

      case this.PAYMENT_STATUS.PROCESSING:
        if (elapsed > 120000) { // 2 minutes
          newStatus = this.PAYMENT_STATUS.CONFIRMING;
          confirmations = 1;
        }
        break;

      case this.PAYMENT_STATUS.CONFIRMING:
        // Simulate confirmations over time
        if (elapsed > 180000 && confirmations < payment.requiredConfirmations) { // 3 minutes
          confirmations = Math.min(confirmations + 1, payment.requiredConfirmations);
        }
        break;
    }

    // Update payment object
    payment.status = newStatus;
    payment.confirmations = confirmations;
    payment.progress = progress;
    payment.updatedAt = now;

    this.activePayments.set(payment.id, payment);
    this.emit('paymentUpdated', payment);

    // Emit specific status events
    if (newStatus !== payment.status) {
      this.emit('paymentStatusChanged', {
        payment,
        oldStatus: payment.status,
        newStatus,
        timestamp: now
      });
    }
  }

  isPaymentComplete(payment) {
    return payment.status === this.PAYMENT_STATUS.CONFIRMED ||
           payment.status === this.PAYMENT_STATUS.FAILED ||
           payment.status === this.PAYMENT_STATUS.CANCELLED ||
           payment.status === this.PAYMENT_STATUS.EXPIRED;
  }

  finalizePayment(payment) {
    const now = Date.now();

    if (payment.confirmations >= payment.requiredConfirmations) {
      payment.status = this.PAYMENT_STATUS.CONFIRMED;
      payment.progress = 100;
      payment.completedAt = now;

      this.emit('paymentConfirmed', payment);
      this.showPaymentSuccessNotification(payment);
    } else if (now - payment.createdAt > 3600000) { // 1 hour timeout
      payment.status = this.PAYMENT_STATUS.EXPIRED;
      this.emit('paymentExpired', payment);
      this.showPaymentExpiredNotification(payment);
    }

    payment.updatedAt = now;
    this.activePayments.set(payment.id, payment);
    this.emit('paymentFinalized', payment);
  }

  generatePaymentId() {
    return 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  estimateConfirmationTime(network, amount) {
    const baseTimes = {
      'bitcoin': 600000,    // 10 minutes
      'ethereum': 300000,   // 5 minutes
      'trc-20': 60000,      // 1 minute
      'erc-20': 300000,     // 5 minutes
      'lightning': 10000    // 10 seconds
    };

    const baseTime = baseTimes[network] || 300000;
    const amountMultiplier = Math.max(0.5, Math.min(2, amount / 1000));

    return baseTime * amountMultiplier;
  }

  // Event system
  on(event, callback) {
    if (!this.paymentSubscribers.has(event)) {
      this.paymentSubscribers.set(event, new Set());
    }
    this.paymentSubscribers.get(event).add(callback);
  }

  off(event, callback) {
    if (this.paymentSubscribers.has(event)) {
      this.paymentSubscribers.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.paymentSubscribers.has(event)) {
      this.paymentSubscribers.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Payment event callback error:', error);
        }
      });
    }
  }

  // Utility methods
  getActivePayments() {
    return Array.from(this.activePayments.values());
  }

  getPaymentById(id) {
    return this.activePayments.get(id);
  }

  getPaymentsByStatus(status) {
    return this.getActivePayments().filter(payment => payment.status === status);
  }

  startPaymentTracking() {
    console.log('📊 Payment tracking started');
  }

  stopPaymentTracking() {
    // Clear all monitoring intervals
    this.activePayments.forEach(payment => {
      if (payment.monitoringInterval) {
        clearInterval(payment.monitoringInterval);
      }
    });
    console.log('⏹️ Payment tracking stopped');
  }

  pauseTracking() {
    console.log('⏸️ Payment tracking paused');
  }

  resumeTracking() {
    console.log('▶️ Payment tracking resumed');
  }

  // Notification helpers
  showPaymentSuccessNotification(payment) {
    this.showNotification({
      type: 'success',
      title: 'Payment Confirmed!',
      message: `${payment.currency} ${payment.amount} has been confirmed on the ${payment.network} network.`,
      duration: 5000
    });
  }

  showPaymentExpiredNotification(payment) {
    this.showNotification({
      type: 'warning',
      title: 'Payment Expired',
      message: `Payment for ${payment.currency} ${payment.amount} has expired. Please try again.`,
      duration: 7000
    });
  }

  showNotification(notification) {
    // Emit custom notification event
    this.emit('notification', notification);

    // Also dispatch DOM event for global handling
    document.dispatchEvent(new CustomEvent('showNotification', {
      detail: notification
    }));
  }

  // Cleanup methods
  cleanup() {
    this.disconnect();

    // Clear all subscribers
    this.paymentSubscribers.clear();
    this.activePayments.clear();
  }
}

// Global instance
export const livePaymentEngine = new LivePaymentEngine();

// Auto-connect when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  livePaymentEngine.connect();
});

// Export for use in other modules
window.livePaymentEngine = livePaymentEngine;
