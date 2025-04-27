import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/config';
import { createClient } from '@supabase/supabase-js';

// Supabase client configuration
const supabaseUrl = SUPABASE_URL;
const supabaseAnonKey = SUPABASE_ANON_KEY;

// Create Supabase client
export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

// Check if Supabase URLs are provided
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Authentication will not work.');
}
