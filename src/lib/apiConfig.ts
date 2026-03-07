export const IS_PROD = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
export const IS_DEV = !IS_PROD;

export const API_BASE_URL = '/api';
export const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

