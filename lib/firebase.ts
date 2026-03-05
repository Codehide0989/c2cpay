import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

// Helper function to get environment variables
const getEnv = (key: string): string | undefined => {
  // In serverless environments (Vercel), process.env is standard
  const val = process.env[key];
  if (val) return val.trim();
  return undefined;
};

// Helper function to parse private key with proper newline handling
const parsePrivateKey = (key: string | undefined): string => {
  if (!key) return "";

  try {
    let cleanedKey = key.trim();

    // 1. Handle double quotes if they were pasted into Vercel dashboard
    if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
      cleanedKey = cleanedKey.substring(1, cleanedKey.length - 1);
    }

    // 2. Handle cases where the whole JSON service account was pasted into one field
    if (cleanedKey.startsWith('{') && cleanedKey.endsWith('}')) {
      try {
        const json = JSON.parse(cleanedKey);
        cleanedKey = json.private_key || json.privateKey || cleanedKey;
      } catch (e) {
        console.warn("Attempted to parse credential as JSON but failed, assuming it's a raw key.");
      }
    }

    // 3. Handle escaped newlines (literal "\n" characters)
    // We handle both single backslash \n and double backslash \\n
    // Also handle \r\n if present
    const keyWithNewlines = cleanedKey
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .trim();

    // 4. Validation and masking for logs
    const hasStart = keyWithNewlines.includes("BEGIN PRIVATE KEY");
    const hasEnd = keyWithNewlines.includes("END PRIVATE KEY");

    console.log(`🔑 Private Key Info - Length: ${keyWithNewlines.length}, HasHeader: ${hasStart}, HasFooter: ${hasEnd}`);

    if (!hasStart && keyWithNewlines.length > 50) {
      console.warn("⚠️ Warning: FIREBASE_PRIVATE_KEY is missing standard BEGIN header.");
      // If it looks like a base64 string but missing headers, try to wrap it
      if (keyWithNewlines.length > 500 && !keyWithNewlines.includes("-----")) {
        console.log("🛠️ Attempting to wrap raw private key with headers...");
        return `-----BEGIN PRIVATE KEY-----\n${keyWithNewlines}\n-----END PRIVATE KEY-----\n`;
      }
    }

    return keyWithNewlines;
  } catch (e) {
    console.error("Error parsing private key:", e);
    return key || "";
  }
};

const getServiceAccount = () => {
  const projectId = getEnv("FIREBASE_PROJECT_ID") || getEnv("VITE_FIREBASE_PROJECT_ID");
  const clientEmail = getEnv("FIREBASE_CLIENT_EMAIL") || getEnv("VITE_FIREBASE_CLIENT_EMAIL");
  const privateKey = parsePrivateKey(
    getEnv("FIREBASE_PRIVATE_KEY") || getEnv("VITE_FIREBASE_PRIVATE_KEY")
  );

  return { projectId, clientEmail, privateKey };
};

// Global singleton state
interface FirebaseState {
  app?: any;
  db?: any;
  storage?: any;
  auth?: any;
  initError?: Error;
}

const state: FirebaseState = {};

/**
 * Robust Firebase initialization for Serverless Functions
 */
export const initFirebase = () => {
  if (state.app && state.db) return state; // Already initialized

  const sa = getServiceAccount();

  // Log credential presence (SAFE LOGGING)
  console.log("🔧 Firebase Init Diagnostics:", {
    projectId: sa.projectId || "MISSING",
    clientEmail: sa.clientEmail ? `${sa.clientEmail.substring(0, 10)}...` : "MISSING",
    privateKeySet: !!sa.privateKey,
    privateKeyLength: sa.privateKey?.length || 0,
    nodeVersion: process.version,
    env: process.env.VERCEL_ENV || 'local'
  });

  if (!sa.projectId || !sa.clientEmail || !sa.privateKey) {
    const missing = [];
    if (!sa.projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!sa.clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!sa.privateKey) missing.push('FIREBASE_PRIVATE_KEY');

    const error = new Error(`Firebase credentials missing: ${missing.join(', ')}. Please check Vercel environment variables.`);
    state.initError = error;
    throw error;
  }

  try {
    const apps = getApps();
    if (apps.length === 0) {
      state.app = initializeApp({
        credential: cert({
          projectId: sa.projectId,
          clientEmail: sa.clientEmail,
          privateKey: sa.privateKey
        }),
        storageBucket: getEnv("FIREBASE_STORAGE_BUCKET") || getEnv("VITE_FIREBASE_STORAGE_BUCKET") || `${sa.projectId}.firebasestorage.app`
      });
      console.log("✅ Firebase Admin - New initialization successful");
    } else {
      state.app = apps[0];
      console.log("✅ Firebase Admin - Using existing application instance");
    }

    state.db = getFirestore(state.app);
    state.storage = getStorage(state.app);
    state.auth = getAuth(state.app);

    return state;
  } catch (e: any) {
    console.error("❌ Firebase Initialization Fatal Error:", e.message);
    state.initError = e;
    throw e;
  }
};


// Create a Proxy to lazy-load services
const createLazyProxy = <T>(serviceName: keyof FirebaseState) => {
  return new Proxy({} as any, {
    get: (_target, prop) => {
      // Allow checking for 'then' to avoid breaking async/await promises
      if (prop === 'then') return undefined;

      try {
        const initializedState = initFirebase();
        const service = initializedState[serviceName];
        if (!service) throw new Error(`Service ${serviceName} failed to initialize.`);

        const value = service[prop];
        return typeof value === 'function' ? value.bind(service) : value;
      } catch (e: any) {
        console.error(`🔴 Firebase Proxy Error [${String(serviceName)}.${String(prop)}]:`, e.message);

        // Log better info for common Firestore errors
        if (e.message && (e.code === 5 || e.message.includes('NOT_FOUND') || e.message.includes('not found'))) {
          throw new Error(`Firebase ${serviceName} not found: Ensure Project ID is correct and Firestore is enabled in Console.`);
        }
        // Re-throw with clear context so API handlers can catch it
        throw new Error(`Firebase ${serviceName} access failed: ${e.message}`);
      }
    }
  }) as T;
};

// Export Proxies instead of direct instances
export const app = createLazyProxy<any>('app');
export const db = createLazyProxy<any>('db');
export const storage = createLazyProxy<any>('storage');
export const auth = createLazyProxy<any>('auth');

// Helper function to check if Firebase is properly initialized (safe check)
export const isFirebaseInitialized = (): boolean => {
  try {
    if (state.app) return true;
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

// Health check function for API endpoints
export const checkFirebaseHealth = async (): Promise<{ healthy: boolean; error?: string }> => {
  try {
    if (!hasFirebaseCredentials()) {
      return { healthy: false, error: "Missing Firebase credentials" };
    }

    // Attempt to initialize if not already done
    initFirebase();

    // Try a simple read operation
    await db.collection('_health').limit(1).get();
    return { healthy: true };
  } catch (error: any) {
    console.error("❌ Firebase health check failed:", error);
    return { healthy: false, error: error.message };
  }
};

