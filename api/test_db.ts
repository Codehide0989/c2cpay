import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, isFirebaseInitialized, hasFirebaseCredentials } from '../lib/firebase';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    const status: any = {
        check: 'FIREBASE_CONNECTION_TEST',
        timestamp: new Date().toISOString(),
        env_vars: {
            // checking if keys exist (not showing values for security)
            NODE_ENV: process.env.NODE_ENV,
            FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
            FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
            FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
            // Fallback checks for VITE_ prefixed (for local dev)
            VITE_FIREBASE_PROJECT_ID: !!process.env.VITE_FIREBASE_PROJECT_ID,
            VITE_FIREBASE_CLIENT_EMAIL: !!process.env.VITE_FIREBASE_CLIENT_EMAIL,
            VITE_FIREBASE_PRIVATE_KEY: !!process.env.VITE_FIREBASE_PRIVATE_KEY,
        },
        hasCredentials: hasFirebaseCredentials(),
        isInitialized: isFirebaseInitialized(),
        connection_status: 'PENDING'
    };

    // Check if credentials are missing
    if (!hasFirebaseCredentials()) {
        status.connection_status = 'FAILED';
        status.error = "Firebase Admin Credentials missing in environment";
        status.message = "Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env.local file or Vercel environment variables.";
        status.missing = {
            FIREBASE_PROJECT_ID: !process.env.FIREBASE_PROJECT_ID && !process.env.VITE_FIREBASE_PROJECT_ID,
            FIREBASE_CLIENT_EMAIL: !process.env.FIREBASE_CLIENT_EMAIL && !process.env.VITE_FIREBASE_CLIENT_EMAIL,
            FIREBASE_PRIVATE_KEY: !process.env.FIREBASE_PRIVATE_KEY && !process.env.VITE_FIREBASE_PRIVATE_KEY,
        };
        return res.status(500).json(status);
    }

    if (!isFirebaseInitialized()) {
        status.connection_status = 'FAILED';
        status.error = "Firebase Admin SDK not initialized";
        status.message = "Firebase credentials are present but initialization failed. Check your private key format and credentials.";
        return res.status(500).json(status);
    }

    try {
        // Try to fetch a single document from a known collection to verify connection
        // Using 'configs' as it seems to be used in other files.
        const snapshot = await db.collection('configs').limit(1).get();

        status.connection_status = 'SUCCESS';
        status.db_type = 'Firebase Admin Firestore';
        status.message = 'Successfully connected to Firebase Firestore (Admin SDK)';
        status.docs_found = snapshot.size;

        return res.status(200).json(status);

    } catch (error: any) {
        status.connection_status = 'FAILED';
        status.error = error.message;
        status.code = error.code;
        
        // Check if error is related to Firebase initialization
        if (error.message && error.message.includes("not initialized")) {
            status.message = "Firebase Admin Credentials missing in environment. " + error.message;
        }
        
        console.error("Firebase Connection Error:", error);

        return res.status(500).json(status);
    }
}
