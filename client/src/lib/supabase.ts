import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Store session in localStorage
    autoRefreshToken: true, // Automatically refresh tokens before they expire
    detectSessionInUrl: true, // Detect session from URL (for OAuth redirects)
    flowType: 'pkce', // Use PKCE flow for better security
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    // Note: To enable 30-day session persistence, configure in Supabase Dashboard:
    // Authentication > Settings > Time-box user sessions: Set to 30 days
    // This setting controls how long refresh tokens remain valid
  },
});



