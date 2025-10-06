// Authentication module
// Use global supabase from CDN
// Import helper functions from supabase.js
import {
  signUp as sbSignUp,
  signIn as sbSignIn,
  signOut as sbSignOut,
  resetPassword as sbResetPassword,
  resendConfirmation as sbResendConfirmation,
  getCurrentUser as sbGetCurrentUser,
  supabaseReady,
  SUPABASE_URL,
  SUPABASE_KEY,
} from "./supabase.js";
import {
  signUp as fbSignUp,
  signIn as fbSignIn,
  signOut as fbSignOut,
  resetPassword as fbResetPassword,
  resendConfirmation as fbResendConfirmation,
  getCurrentUser as fbGetCurrentUser,
  firebaseReady,
} from "./firebase.js";

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.currentProfile = null;
    this.supClient = null;
    this.adapter = null; // will be 'supabase' or 'firebase'
    this.init();
  }

  async init() {
    // Listen for auth state changes
    // Decide adapter (firebase preferred if configured)
    const useFirebase = window.USE_AUTH === 'firebase';

    if (useFirebase) {
      const fb = await firebaseReady;
      if (!fb) {
        console.error('Firebase not available; falling back to Supabase');
      } else {
        this.adapter = 'firebase';
        this.supClient = fb;
        // For firebase, auth state is observed via onAuthStateChanged
        fb.auth.onAuthStateChanged(async (user) => {
          if (user) await this.handleSignIn(); else this.handleSignOut();
        });
      }
    }

    if (!this.adapter) {
      // Wait for supabase client initialization (if it's loaded via CDN it may be async)
      const sup = await supabaseReady;
      // prefer the resolved client, otherwise create a local client from global window.supabase
      this.supClient =
        sup ||
        (window.supabase && window.supabase.createClient
          ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
          : null);
      if (!this.supClient) {
        console.error("Supabase client failed to initialize (timeout).");
        return;
      }
      if (!this.supClient.auth) {
        console.error("Supabase auth is undefined on client.");
        return;
      }
      this.adapter = 'supabase';
      this.supClient.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await this.handleSignIn(session);
      } else if (event === "SIGNED_OUT") {
        this.handleSignOut();
      } else if (event === "TOKEN_REFRESHED" && session) {
        await this.handleSignIn(session);
      }
    });

    // Check current session
    await this.checkSession();
  }

  async checkSession() {
    try {
      if (this.adapter === 'firebase') {
        const { user, profile } = await fbGetCurrentUser();
        if (user && profile) {
          this.currentUser = user;
          this.currentProfile = profile;
          return true;
        }
        return false;
      }

      const { data: userData } = await this.supClient.auth.getUser();
      const user = userData?.user || null;
      if (user) {
        const { data: profile, error } = await this.supClient
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (error) {
          console.error("Profile fetch error:", error);
          return false;
        }
        this.currentUser = user;
        this.currentProfile = profile;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Session check error:", error);
      return false;
    }
  }}

  async handleSignIn(session) {
    try {
      if (this.adapter === 'firebase') {
        const { user, profile } = await fbGetCurrentUser();
        if (!user) return;
        this.currentUser = user;
        this.currentProfile = profile;
        // Firebase: update last login timestamp on profile doc
        if (profile) {
          try {
            await this.supClient.db.collection('profiles').doc(user.uid).update({ last_login_at: new Date().toISOString() });
          } catch (e) { /* ignore */ }
        }
        this.refreshDashboardUI();
        return;
      }

      // Supabase path
      const { data: userData } = await this.supClient.auth.getUser();
      const user = userData?.user || null;
      if (!user) return;
      const { data: profile, error } = await this.supClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) {
        console.error("Profile fetch error:", error);
      }
      this.currentUser = user;
      this.currentProfile = profile;

      // Update last login
      if (profile) {
        await this.supClient
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      // Refresh dashboard UI if available
      this.refreshDashboardUI();
    } catch (error) {
      console.error("Sign in handler error:", error);
    }
  }

  handleSignOut() {
    this.currentUser = null;
    this.currentProfile = null;
  }

  async register(email, password, fullName) {
    try {
      if (this.adapter === 'firebase') {
        const { data, error } = await fbSignUp(email, password, fullName);
        if (error) throw error;
        return { success: true, data };
      } else {
        const { data, error } = await sbSignUp(email, password, fullName);
        if (error) throw error;
        return { success: true, data };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async login(email, password) {
    try {
      if (this.adapter === 'firebase') {
        const { data, error } = await fbSignIn(email, password);
        if (error) throw error;
        return { success: true, data };
      } else {
        const { data, error } = await sbSignIn(email, password);
        if (error) throw error;
        return { success: true, data };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      if (this.adapter === 'firebase') {
        const { error } = await fbSignOut();
        if (error) throw error;
        return { success: true };
      } else {
        const { error } = await sbSignOut();
        if (error) throw error;
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async forgotPassword(email) {
    try {
      if (this.adapter === 'firebase') {
        const { error } = await fbResetPassword(email);
        if (error) throw error;
        return { success: true };
      } else {
        const { error } = await sbResetPassword(email);
        if (error) throw error;
        return { success: true };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async resendVerification(email) {
    try {
      if (this.adapter === 'firebase') {
        const { error } = await fbResendConfirmation(email);
        if (error) throw error;
        return { success: true };
      } else {
        const { error } = await sbResendConfirmation(email);
        if (error) throw error;
        return { success: true };
      }
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
    if (
      window.tradingDashboard &&
      window.tradingDashboard.updateUserInterface
    ) {
      console.log("Refreshing dashboard UI with user data");
      window.tradingDashboard.updateUserInterface();
    }
  }
}

export const authManager = new AuthManager();
