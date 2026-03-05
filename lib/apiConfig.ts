/**
 * Centralized API configuration for both local development and Vercel production.
 */

const isServer = typeof window === 'undefined';

// Automatic Environment Detection
export const IS_PROD =
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') ||
    (typeof process !== 'undefined' && !!process.env.VERCEL) ||
    (typeof window !== 'undefined' && (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'));
export const IS_DEV = !IS_PROD;

/**
 * Get the base URL of the application.
 * In a browser, we fallback to window.location.origin if environment variables are missing.
 */
export const getBaseUrl = (): string => {
    if (!isServer) {
        return window.location.origin;
    }

    // Server-side
    const env = typeof process !== 'undefined' ? process.env : {};
    return env.NEXT_PUBLIC_BASE_URL ||
        (env.VERCEL_URL ? `https://${env.VERCEL_URL}` :
            'http://localhost:3000');
};

/**
 * Get the API server URL.
 * Locally this is typically http://localhost:3001.
 * In production (Vercel), API routes are served from the same domain under /api.
 */
export const getApiServerUrl = (): string => {
    const env = typeof process !== 'undefined' ? process.env : {};

    // If we have an explicit environment variable, use it
    if (env.API_SERVER_URL) {
        return env.API_SERVER_URL;
    }

    if (env.VITE_API_SERVER_URL) {
        return env.VITE_API_SERVER_URL;
    }

    // Fallback logic
    if (IS_DEV) {
        return 'http://localhost:3001';
    }

    // In production on Vercel, the API is at the same origin
    return isServer ? '' : window.location.origin;
};

export const API_SERVER_URL = getApiServerUrl();
export const BASE_URL = getBaseUrl();

// For easy use in template literals: `${API_BASE_URL}/admin`
export const API_BASE_URL = `${API_SERVER_URL}/api`;

console.log(`[API Config] Environment: ${IS_PROD ? 'Production' : 'Development'}`);
console.log(`[API Config] API Server: ${API_SERVER_URL}`);
console.log(`[API Config] Base URL: ${BASE_URL}`);
