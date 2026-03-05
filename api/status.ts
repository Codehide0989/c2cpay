import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, initFirebase } from '../lib/firebase';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    const status: any = {
        isConnected: false,
        envVars: {
            projectId: !!(process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID),
            clientEmail: !!(process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL),
            privateKey: !!(process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY),
        },
        dbType: 'Firebase Admin Firestore',
        error: null as string | null,
        timestamp: new Date().toISOString(),
        region: process.env.VERCEL_REGION || 'DEV',
    };

    try {
        // 1. Check Credentials Presence
        if (!status.envVars.projectId || !status.envVars.clientEmail || !status.envVars.privateKey) {
            status.error = "Missing required environment variables in Vercel. Please add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to Vercel dashboard.";
            return response.status(200).json({ ...status, stateText: 'Configuration Error' });
        }

        // 2. Initialize
        try {
            initFirebase();
        } catch (initError: any) {
            status.error = "Init Error: " + initError.message;
            return response.status(200).json({ ...status, stateText: 'Initialization Failed' });
        }

        // 3. Test Connection
        try {
            await db.collection('configs').limit(1).get();
            status.isConnected = true;
            return response.status(200).json({
                ...status,
                stateText: 'Connected',
                timestamp: new Date().toISOString()
            });
        } catch (dbError: any) {
            status.error = "Database Query Error: " + dbError.message;
            return response.status(200).json({
                ...status,
                stateText: 'Query Failed',
                timestamp: new Date().toISOString()
            });
        }

    } catch (err: any) {
        status.error = "Critical Error: " + (err.message || "Unknown");
        return response.status(200).json({
            ...status,
            stateText: 'Critical Error',
            timestamp: new Date().toISOString()
        });
    }
}
