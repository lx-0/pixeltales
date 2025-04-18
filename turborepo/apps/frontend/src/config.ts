/**
 * Application configuration
 */

// API base URL from environment variable with fallback
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
