// Session Management and Route Guards
import { getStorageItem, setStorageItem, removeStorageItem, showToast } from './utils.js';

export class SessionManager {
  static SESSION_KEY = 'maxprofit_session';
  static DEFAULT_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
  static REMEMBER_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days
  
  static createSession(user, rememberMe = false) {
    const expiry = rememberMe ? this.REMEMBER_EXPIRY : this.DEFAULT_EXPIRY;
    const session = {
      userId: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      loginTime: Date.now(),
      expiresAt: Date.now() + expiry,
      token: this.generateToken()
    };
    
    setStorageItem(this.SESSION_KEY, session);
    return session;
  }
  
  static getSession() {
    const session = getStorageItem(this.SESSION_KEY);
    if (!session) return null;
    
    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      this.clearSession();
      return null;
    }
    
    return session;
  }
  
  static clearSession() {
    removeStorageItem(this.SESSION_KEY);
  }
  
  static isAuthenticated() {
    return !!this.getSession();
  }
  
  static hasRole(role) {
    const session = this.getSession();
    return session && session.role === role;
  }
  
  static getCurrentUser() {
    const session = this.getSession();
    return session ? {
      _id: session.userId,
      email: session.email,
      fullName: session.fullName,
      role: session.role
    } : null;
  }
  
  static generateToken() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
  
  static extendSession() {
    const session = this.getSession();
    if (session) {
      session.expiresAt = Date.now() + this.DEFAULT_EXPIRY;
      setStorageItem(this.SESSION_KEY, session);
    }
  }
}

// Route Guards
export function requireAuth() {
  if (!SessionManager.isAuthenticated()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

export function requireAdmin() {
  if (!SessionManager.hasRole('admin')) {
    showToast('Access denied. Admin privileges required.', 'error');
    window.location.href = 'dashboard.html';
    return false;
  }
  return true;
}

export function redirectIfAuthenticated() {
  if (SessionManager.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return true;
  }
  return false;
}

// Initialize session management
document.addEventListener('DOMContentLoaded', () => {
  // Auto-extend session on activity
  let activityTimer;
  
  function resetActivityTimer() {
    clearTimeout(activityTimer);
    activityTimer = setTimeout(() => {
      SessionManager.extendSession();
    }, 5 * 60 * 1000); // 5 minutes
  }
  
  // Listen for user activity
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetActivityTimer, true);
  });
  
  // Check session on page load
  const isAuthPage = window.location.pathname.includes('login.html') || 
                     window.location.pathname.includes('signup.html');
  const isProtectedPage = window.location.pathname.includes('dashboard.html') || 
                          window.location.pathname.includes('admin.html') ||
                          window.location.pathname.includes('deposit.html') ||
                          window.location.pathname.includes('withdraw.html') ||
                          window.location.pathname.includes('settings.html');
  
  if (isAuthPage) {
    redirectIfAuthenticated();
  } else if (isProtectedPage) {
    if (!requireAuth()) return;
    
    // Check admin access for admin page
    if (window.location.pathname.includes('admin.html')) {
      requireAdmin();
    }
  }
});