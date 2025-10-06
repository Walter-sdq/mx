// Supabase client configuration
// Use CDN import for browser compatibility
export const SUPABASE_URL = "https://cwwcyqhzmelevlcrrecc.supabase.co"; // <-- Replace with your Supabase URL
export const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3d2N5cWh6bWVsZXZsY3JyZWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDg3OTIsImV4cCI6MjA3MDc4NDc5Mn0.iE6sZQHqb_wjGk19DBcKtw-xePnpzVqd-Lfw2DafKho"; // <-- Replace with your Supabase anon key

// Initialize supabase client with error handling
let supabase = null;
// Promise that resolves when supabase client is initialized (or null on timeout)
let _resolveSupabaseReady;
export const supabaseReady = new Promise((res) => {
  _resolveSupabaseReady = res;
});

function initializeSupabase() {
  if (window.supabase && !supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    console.log("Supabase client initialized");
    // resolve readiness promise
    try {
      _resolveSupabaseReady(supabase);
    } catch (e) {
      /* ignore */
    }
  }
}

// Initialize immediately if supabase is already loaded
if (window.supabase) {
  initializeSupabase();
} else {
  // Try to dynamically load the supabase-js CDN script (if not already present)
  const CDN_SRC =
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/index.min.js";

  function loadSupabaseScript() {
    // If another loader already created the script, wait for window.supabase
    if (window.supabase) {
      initializeSupabase();
      return;
    }

    // Avoid adding multiple script tags
    if (document.querySelector(`script[src="${CDN_SRC}"]`)) {
      // Script exists but window.supabase not ready yet - set a short poll
      const check = setInterval(() => {
        if (window.supabase) {
          clearInterval(check);
          initializeSupabase();
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.src = CDN_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Give a tick for the global to be available
      setTimeout(() => initializeSupabase(), 50);
    };
    script.onerror = (err) => {
      console.error("Failed to load supabase-js from CDN:", err);
      try {
        _resolveSupabaseReady(null);
      } catch (e) {
        /* ignore */
      }
    };
    document.head.appendChild(script);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!supabase) {
        console.error("Supabase client failed to initialize (timeout)");
        try {
          _resolveSupabaseReady(null);
        } catch (e) {
          /* ignore */
        }
      }
    }, 10000);
  }

  loadSupabaseScript();
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
