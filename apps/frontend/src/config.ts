/**
 * Application configuration
 */

// API base URL from environment variable with fallback
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Supabase configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug flags
export const DEBUG_AUTH = import.meta.env.VITE_DEBUG_AUTH === 'true';
export const DEBUG_WEBSOCKET = import.meta.env.VITE_DEBUG_WEBSOCKET === 'true';
export const DEBUG_SPEECH_BUBBLES = import.meta.env.VITE_DEBUG_SPEECH_BUBBLES === 'true';
