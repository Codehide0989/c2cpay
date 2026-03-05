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
            storageBucket: !!(process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET),
        },
        details: {
            projectId: (process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'MISSING'),
            clientEmail: (process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL || 'MISSING'),
            storageBucket: (process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || 'MISSING'),
        },
        dbType: 'Firebase Admin Firestore',
        error: null as string | null,
        timestamp: new Date().toISOString(),
        region: process.env.VERCEL_REGION || 'LOCAL',
    };

    try {
        // 1. Check Credentials Presence
        if (!status.envVars.projectId || !status.envVars.clientEmail || !status.envVars.privateKey) {
            const missing = [];
            if (!status.envVars.projectId) missing.push('PROJECT_ID');
            if (!status.envVars.clientEmail) missing.push('CLIENT_EMAIL');
            if (!status.envVars.privateKey) missing.push('PRIVATE_KEY');

            status.error = `Missing environment variables in Vercel: ${missing.join(', ')}. Please update your Vercel project settings.`;
            return response.status(200).json({ ...status, stateText: 'Config Error' });
        }

        // 2. Initialize
        try {
            initFirebase();
        } catch (initError: any) {
            status.error = "Firebase Init Failed: " + initError.message;
            return response.status(200).json({ ...status, stateText: 'Init Error' });
        }

        // 3. Test Connection with a real query
        try {
            // Check if we can reach the DB
            await db.collection('_health').limit(1).get();
            status.isConnected = true;
            return response.status(200).json({
                ...status,
                stateText: 'Healthy',
                timestamp: new Date().toISOString()
            });
        } catch (dbError: any) {
            status.error = "Database Connection Error: " + dbError.message +
                ". Check if Firestore is enabled for this project and if Project ID matches.";
            return response.status(200).json({
                ...status,
                stateText: 'Query Error',
                timestamp: new Date().toISOString()
            });
        }

    } catch (err: any) {
        status.error = "Critical API Error: " + (err.message || "Unknown");
        return response.status(200).json({
            ...status,
            stateText: 'System Crash',
            timestamp: new Date().toISOString()
        });
    }
}
