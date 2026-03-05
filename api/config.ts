import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, isFirebaseInitialized, hasFirebaseCredentials } from '../lib/firebase';
import { FieldValue, Timestamp } from "firebase-admin/firestore";

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    // Check Firebase credentials before proceeding
    if (!hasFirebaseCredentials()) {
        return response.status(500).json({
            error: "Backend Error: Firebase Admin Credentials missing in environment",
            message: "Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env.local file or Vercel environment variables.",
            details: {
                missing: {
                    FIREBASE_PROJECT_ID: !process.env.FIREBASE_PROJECT_ID && !process.env.VITE_FIREBASE_PROJECT_ID,
                    FIREBASE_CLIENT_EMAIL: !process.env.FIREBASE_CLIENT_EMAIL && !process.env.VITE_FIREBASE_CLIENT_EMAIL,
                    FIREBASE_PRIVATE_KEY: !process.env.FIREBASE_PRIVATE_KEY && !process.env.VITE_FIREBASE_PRIVATE_KEY,
                }
            }
        });
    }

    if (!isFirebaseInitialized()) {
        return response.status(500).json({
            error: "Backend Error: Firebase Admin SDK not initialized",
            message: "Firebase credentials are present but initialization failed. Check your private key format and credentials."
        });
    }

    try {
        const configsRef = db.collection('configs');

        if (request.method === 'GET') {
            const snapshot = await configsRef.orderBy('updatedAt', 'desc').limit(1).get();

            if (!snapshot.empty) {
                const docData = snapshot.docs[0].data();
                return response.status(200).json({ id: snapshot.docs[0].id, ...docData });
            }
            return response.status(200).json({});
        }

        if (request.method === 'POST') {
            const { pa, pn, tn, am, title, amountLocked, redirectUrl, maintenanceMode, maintenanceMessage } = request.body;

            console.log('📝 Saving config:', { pa, pn, tn, am, title, amountLocked, redirectUrl, maintenanceMode, maintenanceMessage });

            // Check for existing config to update
            const snapshot = await configsRef.orderBy('updatedAt', 'desc').limit(1).get();

            // Build Firestore data object, filtering out undefined values
            // Firestore doesn't accept undefined, so we provide defaults or omit the field
            const firestoreData: any = {
                pa: pa || 'shopc2c@upi',
                pn: pn || 'ShopC2C Store',
                tn: tn || 'Order Payment',
                am: am || '0',
                title: title || 'Secure Payment',
                amountLocked: amountLocked === true, // Ensure boolean, default to false
                maintenanceMode: maintenanceMode === true, // Ensure boolean, default to false
                maintenanceMessage: maintenanceMessage || '', // Default to empty string
                updatedAt: Timestamp.now()
            };

            // Only add redirectUrl if it's defined and not empty
            if (redirectUrl && redirectUrl.trim() !== '') {
                firestoreData.redirectUrl = redirectUrl;
            }

            console.log('✅ Firestore data prepared:', firestoreData);

            if (!snapshot.empty) {
                // Update existing
                const docId = snapshot.docs[0].id;
                await configsRef.doc(docId).update(firestoreData);
                console.log('✅ Config updated successfully');
                return response.status(200).json({ id: docId, ...firestoreData });
            } else {
                // Create new
                const docRef = await configsRef.add(firestoreData);
                console.log('✅ Config created successfully');
                return response.status(200).json({ id: docRef.id, ...firestoreData });
            }
        }

        return response.status(405).json({ error: 'Method not allowed' });

    } catch (error: any) {
        console.error("Critical Error in /api/config:", error);

        // Check if error is related to Firebase initialization
        if (error.message && error.message.includes("not initialized")) {
            return response.status(500).json({
                error: "Backend Error: Firebase Admin Credentials missing in environment",
                message: error.message,
                details: "Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env.local file or Vercel environment variables."
            });
        }

        return response.status(500).json({
            error: "Internal Server Error",
            details: error.message
        });
    }
}
