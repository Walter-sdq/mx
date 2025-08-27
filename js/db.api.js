// API Client for NeDB backend
import { API_BASE_URL } from './config.js';

// API request helper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    credentials: 'include', // Include cookies for authentication
    ...options
  };
  
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, message: data.error || 'Request failed' };
    }
    
    return { success: true, data: data.data };
  } catch (error) {
    console.error('API request failed:', error);
    return { success: false, message: 'Network error' };
  }
}

// Database operations for NeDB backend
export const DB = {
  // User operations
  async createUser(userData) {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: userData
    });
  },
  
  async authenticateUser(email, password) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },
  
  async getCurrentUser() {
    return apiRequest('/auth/me');
  },
  
  async logout() {
    return apiRequest('/auth/logout', {
      method: 'POST'
    });
  },
  
  async getUserById(userId) {
    return apiRequest(`/users/${userId}`);
  },
  
  async updateUser(userId, updates) {
    return apiRequest(`/users/${userId}`, {
      method: 'PATCH',
      body: updates
    });
  },
  
  async getAllUsers() {
    return apiRequest('/users');
  },
  
  async deleteUser(userId) {
    return apiRequest(`/users/${userId}`, {
      method: 'DELETE'
    });
  },
  
  // Transaction operations
  async createTransaction(transactionData) {
    return apiRequest('/transactions', {
      method: 'POST',
      body: transactionData
    });
  },
  
  async getTransactions(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiRequest(`/transactions?${params}`);
  },
  
  async updateTransaction(transactionId, updates) {
    return apiRequest(`/transactions/${transactionId}`, {
      method: 'PATCH',
      body: updates
    });
  },
  
  // Trade operations
  async createTrade(tradeData) {
    return apiRequest('/trades', {
      method: 'POST',
      body: tradeData
    });
  },
  
  async getTrades(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiRequest(`/trades?${params}`);
  },
  
  async updateTrade(tradeId, updates) {
    return apiRequest(`/trades/${tradeId}`, {
      method: 'PATCH',
      body: updates
    });
  },
  
  async deleteTrade(tradeId) {
    return apiRequest(`/trades/${tradeId}`, {
      method: 'DELETE'
    });
  },
  
  // Withdrawal operations
  async createWithdrawal(withdrawalData) {
    return apiRequest('/withdrawals', {
      method: 'POST',
      body: withdrawalData
    });
  },
  
  async getWithdrawals(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiRequest(`/withdrawals?${params}`);
  },
  
  async updateWithdrawal(withdrawalId, updates) {
    return apiRequest(`/withdrawals/${withdrawalId}`, {
      method: 'PATCH',
      body: updates
    });
  },
  
  // Notification operations
  async createNotification(notificationData) {
    return apiRequest('/notifications', {
      method: 'POST',
      body: notificationData
    });
  },
  
  async getNotifications(filters = {}) {
    const params = new URLSearchParams(filters);
    return apiRequest(`/notifications?${params}`);
  },
  
  async updateNotification(notificationId, updates) {
    return apiRequest(`/notifications/${notificationId}`, {
      method: 'PATCH',
      body: updates
    });
  },
  
  async markAllNotificationsRead(userId) {
    return apiRequest('/notifications/mark-all-read', {
      method: 'POST',
      body: { userId }
    });
  }
};