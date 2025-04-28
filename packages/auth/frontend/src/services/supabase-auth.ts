import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Logger } from '@yesterday-ai/logger-frontend';

// Hold the client instance internally
let supabaseAuthInternal: SupabaseClient | null = null;

// Configuration interface
export interface SupabaseAuthConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Initializes the Supabase client for the auth package.
 * This must be called once by the consuming application.
 * @param {SupabaseAuthConfig} config - The Supabase URL and Anon Key.
 */
export function initializeSupabaseAuth(config: SupabaseAuthConfig): void {
  if (supabaseAuthInternal) {
    Logger.warn('SupabaseAuth', 'Supabase auth client already initialized.');
    return;
  }
  if (!config || !config.supabaseUrl || !config.supabaseAnonKey) {
    Logger.error('SupabaseAuth', 'Supabase URL and Anon Key are required for initialization.');
    return;
  }
  Logger.info('SupabaseAuth', 'Initializing Supabase auth client...');
  supabaseAuthInternal = createClient(config.supabaseUrl, config.supabaseAnonKey);
  supabaseAuth = supabaseAuthInternal;
  Logger.info('SupabaseAuth', 'Supabase auth client initialized.', {
    supabaseAuthInternal,
    supabaseAuth,
  });
}

/**
 * Gets the initialized Supabase client instance.
 * Throws an error if initializeSupabaseAuth hasn't been called.
 * @returns {SupabaseClient} The Supabase client instance.
 * @deprecated Use the exported supabaseAuth constant and ensure it's initialized, or handle null.
 */
export function getSupabaseAuthClient(): SupabaseClient {
  if (!supabaseAuthInternal) {
    throw new Error('Supabase auth client not initialized. Call initializeSupabaseAuth first.');
  }
  return supabaseAuthInternal;
}

// Re-export under the original name, but consumers must check for null
// or ensure initializeSupabaseAuth runs before accessing.
export let supabaseAuth: SupabaseClient | null = supabaseAuthInternal;

// Remove direct client creation using import.meta.env
// const supabaseUrl = import.meta.env.SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.SUPABASE_ANON_KEY;
// export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
// if (!supabaseUrl || !supabaseAnonKey) { ... warning ... }
