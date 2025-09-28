// Authentication module
// Use global supabase from CDN
// Import helper functions from supabase.js
import { signUp, signIn, signOut, resetPassword, resendConfirmation, getCurrentUser } from './supabase.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.currentProfile = null;
    this.init();
  }
  
  async init() {
    // Listen for auth state changes
    if (!window.supabase || !window.supabase.createClient) {
      console.error('Supabase client not loaded.');
      return;
    }
    if (!supabase || !supabase.auth) {
      console.error('Supabase auth is undefined.');
      return;
    }
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await this.handleSignIn(session);
      } else if (event === 'SIGNED_OUT') {
        this.handleSignOut();
      } else if (event === 'TOKEN_REFRESHED' && session) {
        await this.handleSignIn(session);
      }
    });
    
    // Check current session
    await this.checkSession();
  }
  
  async checkSession() {
    try {
      const current = await getCurrentUser();
      if (current.user && current.profile) {
        this.currentUser = current.user;
        this.currentProfile = current.profile;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session check error:', error);
      return false;
    }
  }
  
  async handleSignIn(session) {
    try {
      const { user, profile } = await getCurrentUser();
      this.currentUser = user;
      this.currentProfile = profile;

      // Update last login
      if (profile) {
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      // Refresh dashboard UI if available
      this.refreshDashboardUI();
    } catch (error) {
      console.error('Sign in handler error:', error);
    }
  }
  
  handleSignOut() {
    this.currentUser = null;
    this.currentProfile = null;
  }
  
  async register(email, password, fullName) {
    try {
      const { data, error } = await signUp(email, password, fullName);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async login(email, password) {
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async logout() {
    try {
      const { error } = await signOut();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async forgotPassword(email) {
    try {
      const { error } = await resetPassword(email);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async resendVerification(email) {
    try {
      const { error } = await resendConfirmation(email);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  isAuthenticated() {
    return !!this.currentUser;
  }
  
  hasRole(role) {
    return this.currentProfile?.role === role;
  }
  
  getUser() {
    return this.currentUser;
  }
  
  getProfile() {
    return this.currentProfile;
  }

  refreshDashboardUI() {
    // Refresh dashboard UI if tradingDashboard is available
    if (window.tradingDashboard && window.tradingDashboard.updateUserInterface) {
      console.log('Refreshing dashboard UI with user data');
      window.tradingDashboard.updateUserInterface();
    }

    // Update username display across pages
    if (window.updateUsernameDisplay) {
      window.updateUsernameDisplay();
    }
  }
}

export const authManager = new AuthManager();