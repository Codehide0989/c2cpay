import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, isFirebaseInitialized, hasFirebaseCredentials } from '../lib/firebase';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    try {
        console.log("Diagnose: Function requested");

        // 0. Environment Sanity Check (Admin SDK)
        // Prioritize FIREBASE_* variables (for Vercel/serverless) over VITE_FIREBASE_*
        const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.VITE_FIREBASE_CLIENT_EMAIL;
        const privateKey = process.env.FIREBASE_PRIVATE_KEY || process.env.VITE_FIREBASE_PRIVATE_KEY;

        console.log("Diagnose: Project ID exists?", !!projectId);

        const status: any = {
            timestamp: new Date().toISOString(),
            env: {
                NODE_ENV: process.env.NODE_ENV,
                PROJECT_ID_SET: !!projectId,
                CLIENT_EMAIL_SET: !!clientEmail,
                PRIVATE_KEY_SET: !!privateKey,
            },
            dbConnection: {
                currentState: 'UNKNOWN',
                dbType: 'Firebase Admin Firestore'
            },
            dbPing: 'NOT_ATTEMPTED',
            firebaseInitialized: isFirebaseInitialized(),
            hasCredentials: hasFirebaseCredentials(),
            error: null
        };

        if (!projectId || !clientEmail || !privateKey) {
            status.error = {
                message: "Firebase Admin Credentials missing in environment",
                missing: {
                    FIREBASE_PROJECT_ID: !projectId,
                    FIREBASE_CLIENT_EMAIL: !clientEmail,
                    FIREBASE_PRIVATE_KEY: !privateKey,
                },
                solution: "Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to .env.local or Vercel environment variables"
            };
            console.error("Diagnose: Firebase Config missing");
            return response.status(200).json(status);
        }

        if (!isFirebaseInitialized()) {
            status.error = {
                message: "Firebase Admin SDK not initialized despite credentials being present",
                solution: "Check your private key format. It should include -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----"
            };
            return response.status(200).json(status);
        }

        try {
            // 1. Attempt Connection (This triggers lazy initialization)
            console.log("Diagnose: Connecting to Firestore (Lazy Init)...");
            const configsRef = db.collection('configs');

            // 2. Real Database Ping (Read 1 doc)
            console.log("Diagnose: Pinging DB...");
            const snapshot = await configsRef.limit(1).get();

            status.dbConnection.currentState = 'CONNECTED';
            status.dbPing = snapshot.empty ? 'EMPTY_COLLECTION_OK' : 'READ_SUCCESS';
            console.log("Diagnose: Ping success.");

        } catch (innerError: any) {
            console.error("Diagnose: Inner Error:", innerError);
            status.error = {
                message: innerError.message,
                name: innerError.name,
                code: innerError.code, // Firestore error code
                stack: innerError.stack
            };
        }

        return response.status(200).json(status);

    } catch (criticalError: any) {
        console.error("Diagnose: CRITICAL FAILURE:", criticalError);
        return response.status(200).json({
            error: "CRITICAL_FUNCTION_CRASH",
            details: criticalError.message,
            stack: criticalError.stack
        });
    }
}
