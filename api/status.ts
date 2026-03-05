import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, isFirebaseInitialized, hasFirebaseCredentials, initFirebase } from '../lib/firebase';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    const status: any = {
        isConnected: false,
        envVarSet: !!process.env.FIREBASE_PROJECT_ID || !!process.env.VITE_FIREBASE_PROJECT_ID,
        dbType: 'Firebase Admin Firestore',
        error: null as string | null,
        timestamp: new Date().toISOString()
    };

    try {
        initFirebase();
    } catch (initError: any) {
        console.error("❌ Status API - Firebase Init Error:", initError.message);
        return response.status(200).json({
            ...status,
            stateText: 'Disconnected',
            error: "Database Connection Failed: " + initError.message
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
