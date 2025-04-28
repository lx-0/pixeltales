/**
 * Application configuration
 */

// API base URL from environment variable with fallback
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
export const API_BASE_HOST = import.meta.env.VITE_BACKEND_HOST || 'http://localhost:3000';

// Supabase configuration
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Development environment check
export const DEV = import.meta.env.VITE_DEV === 'true';

// Debug flags
export const DEBUG = import.meta.env.VITE_DEBUG === 'true';
export const DEBUG_APP = import.meta.env.VITE_DEBUG_APP === 'true';
export const DEBUG_API = import.meta.env.VITE_DEBUG_API === 'true';
export const DEBUG_AUTH = import.meta.env.VITE_DEBUG_AUTH === 'true';
export const DEBUG_WEBSOCKET = import.meta.env.VITE_DEBUG_WEBSOCKET === 'true';
export const DEBUG_SCENE = import.meta.env.VITE_DEBUG_SCENE === 'true';
export const DEBUG_SCENE_STATE = import.meta.env.VITE_DEBUG_SCENE_STATE === 'true';
export const DEBUG_UI_CONTROLS = import.meta.env.VITE_DEBUG_UI_CONTROLS === 'true';
export const DEBUG_SPEECH_BUBBLES = import.meta.env.VITE_DEBUG_SPEECH_BUBBLES === 'true';
export const DEBUG_CHARACTER_MANAGER = import.meta.env.VITE_DEBUG_CHARACTER_MANAGER === 'true';
export const DEBUG_CHAT_MESSAGES_UI = import.meta.env.VITE_DEBUG_CHAT_MESSAGES_UI === 'true';
