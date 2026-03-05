import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

// Helper function to get environment variables
const getEnv = (key: string): string | undefined => {
  // In serverless environments (Vercel), process.env is standard
  const val = typeof process !== 'undefined' ? process.env[key] : undefined;
  if (val) return val.trim();
  return undefined;
};

// Helper function to parse private key with proper newline handling
const parsePrivateKey = (key: string | undefined): string => {
  if (!key) return "";

  try {
    let cleanedKey = key.trim();

    // 1. Remove wrapping quotes if present
    if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
      cleanedKey = cleanedKey.substring(1, cleanedKey.length - 1);
    }

    // 2. Handle cases where the whole JSON service account was pasted
    if (cleanedKey.startsWith('{') && cleanedKey.endsWith('}')) {
      try {
        const json = JSON.parse(cleanedKey);
        cleanedKey = json.private_key || json.privateKey || cleanedKey;
      } catch (e) {
        // Fallback to raw key
      }
    }

    // 3. Handle double-escaped newlines common in CI/Vercel env vars
    // The requirement specifically mentioned replace(/\n/g, '\n') which handles literal newline characters,
    // but the actual issue in Vercel is often literal "\n" strings (backslashes).
    // We handle both to be absolutely safe as per requirements.
    const keyWithNewlines = cleanedKey
      .replace(/\\n/g, '\n')
      .replace(/\n/g, '\n'); // As requested, though it's technically a no-op in most JS engines

    // 4. Wrap with headers if missing but looks like a base64 key
    if (!keyWithNewlines.includes("BEGIN PRIVATE KEY") && keyWithNewlines.length > 500) {
      return `-----BEGIN PRIVATE KEY-----\n${keyWithNewlines}\n-----END PRIVATE KEY-----\n`;
    }

    return keyWithNewlines;
  } catch (e) {
    console.error("Error parsing private key:", e);
    return key || "";
  }
};

const getServiceAccount = () => {
  // Read all Firebase credentials strictly from environment variables.
  // We prefer non-VITE prefixed ones as they are intended for server-side use.
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL;
  const privateKey = parsePrivateKey(
    process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY
  );

  return { projectId, clientEmail, privateKey };
};

// Global singleton state for Firebase Admin SDK
interface FirebaseState {
  app?: any;
  db?: any;
  storage?: any;
  auth?: any;
  initError?: Error;
  fallbackMode: boolean;
}

const state: FirebaseState = {
  fallbackMode: false
};

/**
 * Robust Firebase initialization for Serverless Functions
 * Uses getApps() to ensure single initialization (admin.apps.length equivalent)
 */
export const initFirebase = () => {
  if (state.app && state.db) return state;

  const sa = getServiceAccount();

  if (!sa.projectId || !sa.clientEmail || !sa.privateKey) {
    const missing = [];
    if (!sa.projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!sa.clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!sa.privateKey) missing.push('FIREBASE_PRIVATE_KEY');

    const error = new Error(`Firebase credentials missing: ${missing.join(', ')}`);
    state.initError = error;
    state.fallbackMode = true;
    console.warn("⚠️ Firebase credentials missing. Entering Safe Fallback Mode.");
    return state;
  }

  try {
    const apps = getApps();
    if (apps.length === 0) {
      console.log(`[Firebase] Initializing new app for project: ${sa.projectId}`);
      state.app = initializeApp({
        credential: cert({
          projectId: sa.projectId,
          clientEmail: sa.clientEmail,
          privateKey: sa.privateKey
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || `${sa.projectId}.firebasestorage.app`
      });
      console.log("✅ Firebase initialized successfully");
    } else {
      console.log("[Firebase] Using existing initialized app");
      state.app = apps[0];
    }

    state.db = getFirestore(state.app);
    state.storage = getStorage(state.app);
    state.auth = getAuth(state.app);
    state.fallbackMode = false;
    state.initError = undefined;

    return state;
  } catch (e: any) {
    console.error("❌ Firebase Initialization Fatal Error:", e.message);
    if (e.message.includes('configuration-not-found')) {
      console.error("💡 TIP: This error usually means the Project ID in your credentials doesn't match the project or Firebase Auth is not enabled in the console.");
    }
    state.initError = e;
    state.fallbackMode = true;
    return state;
  }
};

// Create a Proxy to lazy-load services and handle errors gracefully
// This implements the requested "Safe Fallback" by preventing crashes
const createLazyProxy = <T>(serviceName: keyof FirebaseState) => {
  return new Proxy({} as any, {
    get: (_target, prop) => {
      if (prop === 'then') return undefined;

      const initializedState = initFirebase();
      const service = initializedState[serviceName];

      if (!service) {
        // Log diagnostics instead of crashing if possible
        const errorMsg = initializedState.initError?.message || `Firebase ${serviceName} unavailable. Check env vars.`;
        console.warn(`[Safe Mode] Attempted to access ${String(serviceName)}.${String(prop)}: ${errorMsg}`);

        // Return a dummy function for method calls to prevent "is not a function" errors
        return (...args: any[]) => {
          console.error(`[Fallback] Call to ${String(serviceName)}.${String(prop)} failed: Service offline`);
          return Promise.reject(new Error(errorMsg));
        };
      }

      const value = service[prop];
      return typeof value === 'function' ? value.bind(service) : value;
    }
  }) as T;
};

// Export Proxies
export const app = createLazyProxy<any>('app');
export const db = createLazyProxy<any>('db');
export const storage = createLazyProxy<any>('storage');
export const auth = createLazyProxy<any>('auth');

// Health check function for API endpoints
export const checkFirebaseHealth = async (): Promise<{
  healthy: boolean;
  firestore: boolean;
  storage: boolean;
  auth: boolean;
  error?: string;
  missingVars?: string[];
  responseTime?: number;
}> => {
  const startTime = Date.now();
  const missingVars: string[] = [];

  if (!process.env.FIREBASE_PROJECT_ID && !process.env.VITE_FIREBASE_PROJECT_ID) missingVars.push('FIREBASE_PROJECT_ID');
  if (!process.env.FIREBASE_CLIENT_EMAIL && !process.env.VITE_FIREBASE_CLIENT_EMAIL) missingVars.push('FIREBASE_CLIENT_EMAIL');
  if (!process.env.FIREBASE_PRIVATE_KEY && !process.env.VITE_FIREBASE_PRIVATE_KEY) missingVars.push('FIREBASE_PRIVATE_KEY');

  if (missingVars.length > 0) {
    return {
      healthy: false,
      firestore: false,
      storage: false,
      auth: false,
      error: `Missing credentials: ${missingVars.join(', ')}`,
      missingVars,
      responseTime: Date.now() - startTime
    };
  }

  const results = {
    firestore: false,
    storage: false,
    auth: false,
    error: undefined as string | undefined
  };

  try {
    initFirebase();
    if (state.initError) throw state.initError;

    // Test Firestore
    try {
      await db.collection('_health').limit(1).get();
      results.firestore = true;
    } catch (e: any) {
      console.error("❌ Firestore check failed:", e.message);
      results.error = results.error || `Firestore: ${e.message}`;
    }

    // Test Storage
    try {
      const bucket = storage.bucket();
      await bucket.exists();
      results.storage = true;
    } catch (e: any) {
      console.error("❌ Storage check failed:", e.message);
      results.error = results.error || `Storage: ${e.message}`;
    }

    // Test Auth
    try {
      // Use listUsers(1) to test the connection to the Auth service
      await auth.listUsers(1);
      results.auth = true;
    } catch (e: any) {
      console.error("❌ Auth check failed:", e.message);

      // Map common errors to user-friendly messages
      let authError = e.message;
      if (e.code === 'auth/configuration-not-found' || e.message?.includes('configuration-not-found')) {
        authError = "Firebase Auth/Identity Platform is NOT enabled in the Firebase Console. Go to Build -> Authentication -> Get Started.";
      } else if (e.code === 'auth/insufficient-permission' || e.message?.includes('permission')) {
        authError = "Service Account lacks 'Firebase Authentication Admin' role. Please check IAM permissions.";
      } else if (e.message?.includes('not found')) {
        authError = "Auth subsystem not found for this project. Ensure you have initialized Auth in the console.";
      }

      results.error = results.error ? `${results.error} | Auth: ${authError}` : `Auth: ${authError}`;
      results.auth = false;
    }

    const healthy = results.firestore && results.storage && results.auth;

    return {
      healthy,
      ...results,
      responseTime: Date.now() - startTime
    };
  } catch (error: any) {
    console.error("❌ Firebase health check fatal error:", error.message);
    return {
      healthy: false,
      firestore: false,
      storage: false,
      auth: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
};

// Helper function to check if Firebase is properly initialized (safe check)
export const isFirebaseInitialized = (): boolean => {
  try {
    if (state.app && !state.initError) return true;
    const sa = getServiceAccount();
    return !!(sa.projectId && sa.clientEmail && sa.privateKey);
  } catch {
    return false;
  }
};

// Helper function to check if credentials are available
export const hasFirebaseCredentials = (): boolean => {
  const sa = getServiceAccount();
  return !!(sa.projectId && sa.clientEmail && sa.privateKey);
};


