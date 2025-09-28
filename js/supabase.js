// Supabase client configuration
// Use CDN import for browser compatibility
const SUPABASE_URL = "https://cwwcyqhzmelevlcrrecc.supabase.co"; // <-- Replace with your Supabase URL
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3d2N5cWh6bWVsZXZsY3JyZWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDg3OTIsImV4cCI6MjA3MDc4NDc5Mn0.iE6sZQHqb_wjGk19DBcKtw-xePnpzVqd-Lfw2DafKho"; // <-- Replace with your Supabase anon key

// Initialize supabase client with error handling
let supabase = null;

function initializeSupabase() {
  if (window.supabase && !supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    console.log('Supabase client initialized');
  }
}

// Initialize immediately if supabase is already loaded
if (window.supabase) {
  initializeSupabase();
} else {
  // Wait for supabase to load
  const checkSupabase = setInterval(() => {
    if (window.supabase) {
      clearInterval(checkSupabase);
      initializeSupabase();
    }
  }, 100);

  // Timeout after 10 seconds
  setTimeout(() => {
    clearInterval(checkSupabase);
    if (!supabase) {
      console.error('Supabase client failed to initialize');
    }
  }, 10000);
}

// Export the supabase client for use in other modules
export { supabase };

// Auth helpers
export async function signUp(email, password, fullName) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // Insert user profile
    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        email: email,
        full_name: fullName,
        role: "user",
        status: "active",
        balance: 0,
        email_confirmed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {
          dark_mode: true,
          notifications: true,
          biometric: false,
        },
      });

      if (profileError) {
        console.error("Profile creation error:", profileError);
      }
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Get user profile
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
      }

      // Update last login
      await supabase
        .from("profiles")
        .update({ last_login: new Date().toISOString() })
        .eq("id", data.user.id);

      return { data: { ...data, profile }, error: null };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login.html`,
  });
  return { error };
}

export async function resendConfirmation(email) {
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email,
  });
  return { error };
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return { user, profile };
  }

  return { user: null, profile: null };
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select()
    .single();

  return { data, error };
}

// API Client class for database operations
class APIClient {
  constructor() {
    this.supabase = supabase;
  }

  // User operations
  async getUser(userId) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  }

  async updateUser(userId, updates) {
    return updateUserProfile(userId, updates);
  }

  // Transaction operations
  async getTransactions(userId) {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  }

  async createTransaction(transaction) {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
    return { data, error };
  }

  // Trade operations
  async getTrades(userId) {
    const { data, error } = await this.supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  }

  async createTrade(trade) {
    const { data, error } = await this.supabase
      .from('trades')
      .insert(trade)
      .select()
      .single();
    return { data, error };
  }

  // Notification operations
  async getNotifications(userId) {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  }

  async markNotificationAsRead(notificationId) {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single();
    return { data, error };
  }

  async markAllNotificationsRead(userId) {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .select();
    return { data, error };
  }

  async deleteNotification(notificationId) {
    const { data, error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
    return { data, error };
  }

  async clearAllNotifications(userId) {
    const { data, error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    return { data, error };
  }

  async createNotification(notification) {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    return { data, error };
  }

  async archiveNotification(notificationId) {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ archived: true })
      .eq('id', notificationId)
      .select()
      .single();
    return { data, error };
  }

  // Price operations for real-time data
  async getPrices() {
    const { data, error } = await this.supabase
      .from('prices')
      .select('*')
      .order('updated_at', { ascending: false });
    return { data, error };
  }

  async updatePrice(symbol, priceData) {
    const { data, error } = await this.supabase
      .from('prices')
      .upsert({
        symbol,
        price: priceData.price,
        change_24h: priceData.change,
        change_percent_24h: priceData.changePercent,
        volume_24h: priceData.volume,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    return { data, error };
  }
}

// Create global instance
export const apiClient = new APIClient();

// Make globally available
window.apiClient = apiClient;
