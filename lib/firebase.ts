import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { getAuth } from "firebase-admin/auth";

// Helper function to get environment variables
// For serverless functions (Vercel), use process.env only
// Prioritize FIREBASE_* variables (server-side) over VITE_FIREBASE_* (client-side)
const getEnv = (key: string): string | undefined => {
  // In serverless environments (Vercel), import.meta.env is not available
  // Always use process.env for server-side Firebase Admin SDK
  return process.env[key];
};

// Helper function to parse private key with proper newline handling
const parsePrivateKey = (key: string | undefined): string => {
  if (!key) return "";

  try {
    const keyWithNewlines = key
      .replace(/\\n/g, '\n')  // Replace literal \n with actual newlines
      .replace(/"/g, '');     // Remove extra quotes if present

    // Check if the key looks basically valid (contains BEGIN PRIVATE KEY)
    if (!keyWithNewlines.includes("BEGIN PRIVATE KEY")) {
      console.warn("⚠️ Warning: FIREBASE_PRIVATE_KEY Env Var might be malformed (missing standard header). Attempting to use as-is or repairing...");
      // Attempt to construct if just the base64 part was provided (rare but possible edge case)
      if (!keyWithNewlines.includes("-----")) {
        return `-----BEGIN PRIVATE KEY-----\n${keyWithNewlines}\n-----END PRIVATE KEY-----\n`;
      }
    }
    return keyWithNewlines;
  } catch (e) {
    console.error("Error parsing private key:", e);
    return key || "";
  }
};

const serviceAccount = {
  // Prioritize FIREBASE_* variables (for serverless/Vercel) over VITE_FIREBASE_*
  projectId: getEnv("FIREBASE_PROJECT_ID") || getEnv("VITE_FIREBASE_PROJECT_ID"),
  clientEmail: getEnv("FIREBASE_CLIENT_EMAIL") || getEnv("VITE_FIREBASE_CLIENT_EMAIL"),
  privateKey: parsePrivateKey(
    getEnv("FIREBASE_PRIVATE_KEY") || getEnv("VITE_FIREBASE_PRIVATE_KEY")
  ),
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

// Initialization function - actually connects to Firebase
// Exported so API handlers can explicitly initialize and handle errors
export const initFirebase = () => {
  if (state.app) return state; // Already initialized
  if (state.initError) throw state.initError; // Previous failure

  // Log credential presence (SAFE LOGGING - NO VALUES)
  console.log("🔧 Firebase Init - Checking Credentials:", {
    projectId: !!serviceAccount.projectId,
    clientEmail: !!serviceAccount.clientEmail,
    privateKey: !!serviceAccount.privateKey,
    privateKeyLength: serviceAccount.privateKey?.length || 0,
    timestamp: new Date().toISOString()
  });

  // Verify credentials
  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    const missingVars = [];
    if (!serviceAccount.projectId) missingVars.push('FIREBASE_PROJECT_ID');
    if (!serviceAccount.clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
    if (!serviceAccount.privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');

    const error = new Error(`Missing Firebase credentials: ${missingVars.join(', ')}`);
    state.initError = error;
    console.error("❌ Firebase Init Failed - Missing Credentials:", missingVars);
    throw error;
  }

  try {
    if (getApps().length === 0) {
      state.app = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: getEnv("FIREBASE_STORAGE_BUCKET") || getEnv("VITE_FIREBASE_STORAGE_BUCKET") || "cyberimg-nexus.firebasestorage.app"
      });
      console.log("✅ Firebase Admin Initialized successfully");
    } else {
      state.app = getApp();
      console.log("✅ Using existing Firebase Admin app");
    }

    state.db = getFirestore(state.app);
    state.storage = getStorage(state.app);
    state.auth = getAuth(state.app);

    console.log("✅ Firebase services ready (Firestore, Storage, Auth)");
    return state;
  } catch (e: any) {
    console.error("❌ Firebase Initialization Failed:", {
      error: e.message,
      code: e.code,
      timestamp: new Date().toISOString()
    });
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
    // Don't auto-init here, just check if we have enough to potentially init
    return hasFirebaseCredentials();
  } catch {
    return false;
  }
};

// Helper function to check if credentials are available
export const hasFirebaseCredentials = (): boolean => {
  const projectId = getEnv("FIREBASE_PROJECT_ID") || getEnv("VITE_FIREBASE_PROJECT_ID");
  const clientEmail = getEnv("FIREBASE_CLIENT_EMAIL") || getEnv("VITE_FIREBASE_CLIENT_EMAIL");
  const privateKey = getEnv("FIREBASE_PRIVATE_KEY") || getEnv("VITE_FIREBASE_PRIVATE_KEY");
  return !!(projectId && clientEmail && privateKey);
};

// Health check function for API endpoints
export const checkFirebaseHealth = async (): Promise<{ healthy: boolean; error?: string }> => {
  try {
    if (!hasFirebaseCredentials()) {
      return { healthy: false, error: "Missing Firebase credentials" };
    }

    // Attempt to initialize if not already done
    if (!state.app) {
      initFirebase();
    }

    // Try a simple read operation
    await db.collection('_health').limit(1).get();
    return { healthy: true };
  } catch (error: any) {
    console.error("❌ Firebase health check failed:", error);
    return { healthy: false, error: error.message };
  }
};

