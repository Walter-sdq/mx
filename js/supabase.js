// Supabase client configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cwwcyqhzmelevlcrrecc.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3d2N5cWh6bWVsZXZsY3JyZWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyMDg3OTIsImV4cCI6MjA3MDc4NDc5Mn0.iE6sZQHqb_wjGk19DBcKtw-xePnpzVqd-Lfw2DafKho';

export const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Auth helpers
export async function signUp(email, password, fullName) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    
    if (error) throw error;
    
    // Insert user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          role: 'user',
          balances: {
            USD: 0,
            BTC: 0,
            ETH: 0
          }
        });
      
      if (profileError) {
        console.error('Profile creation error:', profileError);
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
      password
    });
    
    if (error) throw error;
    
    // Get user profile
    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }
      
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
    redirectTo: `${window.location.origin}/reset-password.html`
  });
  return { error };
}

export async function resendConfirmation(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email
  });
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    return { user, profile };
  }
  
  return { user: null, profile: null };
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
}