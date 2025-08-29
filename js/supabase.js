// Supabase client setup
// Replace with your Supabase project URL and public anon key
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// User table schema (for reference)
// id: uuid (primary key)
// email: text
// full_name: text
// profile_pic: text (URL)
// created_at: timestamp
// updated_at: timestamp

// Helper: Sign up user
async function signupUser(email, password, fullName) {
  const { user, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName }
    }
  });
  return { user, error };
}

// Helper: Update user profile
async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);
  return { data, error };
}

// Helper: Upload profile picture
async function uploadProfilePic(userId, file) {
  const fileName = `${userId}/${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage
    .from('profile-pics')
    .upload(fileName, file);
  if (error) return { error };
  const publicUrl = supabase.storage.from('profile-pics').getPublicUrl(fileName).data.publicUrl;
  await updateUserProfile(userId, { profile_pic: publicUrl });
  return { publicUrl };
}

window.supabaseApi = {
  signupUser,
  updateUserProfile,
  uploadProfilePic
};
