// Authentication module
import { DATA_LAYER } from './config.js';
import { DB as LokiDB } from './db.loki.js';
import { DB as ApiDB } from './db.api.js';
import { setStorageItem, getStorageItem, removeStorageItem, showToast } from './utils.js';

// Select the appropriate database implementation
const DB = DATA_LAYER === 'lokijs' ? LokiDB : ApiDB;

// Session management
let currentSession = null;

export const Auth = {
  // Sign up new user
  async signup(userData) {
    try {
      const result = await DB.createUser(userData);
      
      if (result.success) {
        // Auto-login after successful signup
        const loginResult = await this.login({
          email: userData.email,
          password: userData.password
        });
        
        return loginResult;
      }
      
      return result;
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Signup failed. Please try again.' };
    }
  },
  
  // Login user
  async login(credentials) {
    try {
      const result = await DB.authenticateUser(credentials.email, credentials.password);
      
      if (result.success) {
        const user = result.data;
        
        // Create session
        const session = {
          userId: user._id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          loginTime: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        // Store session
        if (DATA_LAYER === 'lokijs') {
          setStorageItem('maxprofit_session', session);
        }
        
        currentSession = session;
        
        // Dispatch login event
        window.dispatchEvent(new CustomEvent('auth:login', { detail: user }));
        
        return { success: true, data: user };
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  },
  
  // Logout user
  async logout() {
    try {
      if (DATA_LAYER === 'nedb') {
        await DB.logout();
      }
      
      // Clear session
      removeStorageItem('maxprofit_session');
      currentSession = null;
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));
      
      // Redirect to login
      window.location.href = 'login.html';
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  },
  
  // Get current session
  async getCurrentSession() {
    if (currentSession && currentSession.expiresAt > Date.now()) {
      return currentSession;
    }
    
    if (DATA_LAYER === 'lokijs') {
      const storedSession = getStorageItem('maxprofit_session');
      if (storedSession && storedSession.expiresAt > Date.now()) {
        currentSession = storedSession;
        return currentSession;
      }
    } else {
      // For NeDB, check with server
      try {
        const result = await DB.getCurrentUser();
        if (result.success) {
          const user = result.data;
          currentSession = {
            userId: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            loginTime: Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
          };
          return currentSession;
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    }
    
    return null;
  },
  
  // Get current user data
  async getCurrentUser() {
    const session = await this.getCurrentSession();
    if (!session) return null;
    
    try {
      const result = await DB.getUserById(session.userId);
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
  
  // Check if user is authenticated
  async isAuthenticated() {
    const session = await this.getCurrentSession();
    return !!session;
  },
  
  // Check if user has specific role
  async hasRole(role) {
    const session = await this.getCurrentSession();
    return session && session.role === role;
  },
  
  // Require authentication (redirect if not authenticated)
  async requireAuth() {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  },
  
  // Require admin role
  async requireAdmin() {
    const hasAdminRole = await this.hasRole('admin');
    if (!hasAdminRole) {
      showToast('Access denied. Admin privileges required.', 'error');
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  },
  
  // Update user profile
  async updateProfile(updates) {
    const session = await this.getCurrentSession();
    if (!session) return { success: false, message: 'Not authenticated' };
    
    try {
      const result = await DB.updateUser(session.userId, updates);
      
      if (result.success) {
        // Update session if email or name changed
        if (updates.email) currentSession.email = updates.email;
        if (updates.fullName) currentSession.fullName = updates.fullName;
        
        if (DATA_LAYER === 'lokijs') {
          setStorageItem('maxprofit_session', currentSession);
        }
        
        // Dispatch profile update event
        window.dispatchEvent(new CustomEvent('auth:profileUpdate', { detail: result.data }));
      }
      
      return result;
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, message: 'Profile update failed' };
    }
  },
  
  // Change password
  async changePassword(currentPassword, newPassword) {
    const session = await this.getCurrentSession();
    if (!session) return { success: false, message: 'Not authenticated' };
    
    try {
      // First verify current password by attempting login
      const verifyResult = await DB.authenticateUser(session.email, currentPassword);
      if (!verifyResult.success) {
        return { success: false, message: 'Current password is incorrect' };
      }
      
      // Update password
      const result = await DB.updateUser(session.userId, {
        password: newPassword // This will be hashed by the DB layer
      });
      
      if (result.success) {
        showToast('Password changed successfully', 'success');
      }
      
      return result;
    } catch (error) {
      console.error('Password change error:', error);
      return { success: false, message: 'Password change failed' };
    }
  }
};

// Initialize authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Check if we're on an auth page
  const isAuthPage = window.location.pathname.includes('login.html') || 
                     window.location.pathname.includes('signup.html');
  
  // Check if we're on a protected page
  const isProtectedPage = window.location.pathname.includes('dashboard.html') || 
                          window.location.pathname.includes('admin.html');
  
  if (isProtectedPage) {
    const isAuth = await Auth.isAuthenticated();
    if (!isAuth) {
      window.location.href = 'login.html';
      return;
    }
    
    // Check admin access for admin page
    if (window.location.pathname.includes('admin.html')) {
      const hasAdminRole = await Auth.hasRole('admin');
      if (!hasAdminRole) {
        showToast('Access denied. Admin privileges required.', 'error');
        window.location.href = 'dashboard.html';
        return;
      }
    }
  }
  
  if (isAuthPage) {
    const isAuth = await Auth.isAuthenticated();
    if (isAuth) {
      window.location.href = 'dashboard.html';
      return;
    }
  }
});

// Listen for auth events
window.addEventListener('auth:login', (event) => {
  console.log('User logged in:', event.detail);
});

window.addEventListener('auth:logout', () => {
  console.log('User logged out');
});

window.addEventListener('auth:profileUpdate', (event) => {
  console.log('Profile updated:', event.detail);
});