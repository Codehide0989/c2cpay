import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, isFirebaseInitialized, hasFirebaseCredentials } from '../lib/firebase';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    const status = {
        isConnected: false,
        envVarSet: !!process.env.FIREBASE_PROJECT_ID || !!process.env.VITE_FIREBASE_PROJECT_ID,
        dbType: 'Firebase Admin Firestore',
        error: null as string | null,
        envCheck: {
            FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
            FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
            FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
        },
        hasCredentials: hasFirebaseCredentials(),
        isInitialized: isFirebaseInitialized()
    };

    // Check if credentials are missing
    if (!hasFirebaseCredentials()) {
        status.error = "Firebase Admin Credentials missing in environment. Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env.local file or Vercel environment variables.";
        return response.status(200).json({
            ...status,
            stateText: 'Disconnected',
            region: process.env.VERCEL_REGION || 'DEV',
            timestamp: new Date().toISOString()
        });
    }

    if (!isFirebaseInitialized()) {
        status.error = "Firebase Admin SDK not initialized. Check your private key format and credentials.";
        return response.status(200).json({
            ...status,
            stateText: 'Disconnected',
            region: process.env.VERCEL_REGION || 'DEV',
            timestamp: new Date().toISOString()
        });
    }

    try {
        // Simple query to verify connection
        await db.collection('configs').limit(1).get();

        status.isConnected = true;

        return response.status(200).json({
            ...status,
            stateText: status.isConnected ? 'Connected' : 'Disconnected',
            region: process.env.VERCEL_REGION || 'DEV',
            timestamp: new Date().toISOString()
        });

    } catch (err: any) {
        // Check if error is related to Firebase initialization
        if (err.message && err.message.includes("not initialized")) {
            status.error = "Firebase Admin Credentials missing in environment. " + err.message;
        } else {
            status.error = err.message || "Unknown Connection Error";
        }
        return response.status(200).json({
            ...status,
            stateText: 'Disconnected',
            region: process.env.VERCEL_REGION || 'DEV',
            timestamp: new Date().toISOString()
        });
    }
}
