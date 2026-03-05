import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, isFirebaseInitialized, hasFirebaseCredentials, initFirebase } from '../lib/firebase';
import { Timestamp } from "firebase-admin/firestore";

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[Admin API ${requestId}] ${request.method} ${request.url} - ${new Date().toISOString()}`);

    try {
        // Explicitly initialize Firebase for the handler to catch errors early
        try {
            initFirebase();
        } catch (initError: any) {
            console.error(`❌ [Admin API ${requestId}] Firebase Admin Init Error:`, initError.message);
            return response.status(500).json({
                error: "Database Connection Error",
                message: "Internal server error connecting to data services.",
                details: initError.message,
                requestId
            });
        }


        const adminsRef = db.collection('admins');

        // Verify PIN
        if (request.method === 'POST') {
            const { pin, action } = request.body;

            // Validate request body
            if (!request.body || typeof request.body !== 'object') {
                console.error(`❌ [Admin API ${requestId}] Invalid request body`);
                return response.status(400).json({
                    error: "Invalid Request",
                    message: "Request body must be a valid JSON object",
                    requestId
                });
            }

            if (!pin && action !== 'change_pin' && action !== 'setup') {
                console.error(`❌ [Admin API ${requestId}] PIN is required for action: ${action || 'login'}`);
                return response.status(400).json({
                    error: "PIN is required",
                    requestId
                });
            }

            try {
                // Fetch first admin document
                const snapshot = await adminsRef.limit(1).get();
                let adminDoc = snapshot.empty ? null : snapshot.docs[0];
                let adminData = adminDoc ? adminDoc.data() : null;

                // SETUP Mode
                if (action === 'setup') {
                    if (!adminDoc) {
                        await adminsRef.add({
                            pin: pin || '1234',
                            updated_at: Timestamp.now()
                        });
                        console.log(`✅ [Admin API ${requestId}] Admin configured successfully`);
                        return response.status(200).json({
                            success: true,
                            message: "Admin configured successfully.",
                            requestId
                        });
                    } else {
                        console.warn(`⚠️ [Admin API ${requestId}] Admin already exists`);
                        return response.status(400).json({
                            error: "Admin already exists.",
                            requestId
                        });
                    }
                }

                // CHANGE PIN Mode
                if (action === 'change_pin') {
                    const { newPin } = request.body;
                    if (!adminDoc) {
                        console.error(`❌ [Admin API ${requestId}] Admin not found for PIN change`);
                        return response.status(404).json({
                            error: "Admin not found.",
                            requestId
                        });
                    }

                    if (adminData?.pin !== pin) {
                        console.warn(`⚠️ [Admin API ${requestId}] Incorrect current PIN`);
                        return response.status(401).json({
                            error: "Current PIN is incorrect.",
                            requestId
                        });
                    }

                    if (!newPin || newPin.length < 4) {
                        console.error(`❌ [Admin API ${requestId}] Invalid new PIN length`);
                        return response.status(400).json({
                            error: "New PIN must be at least 4 digits.",
                            requestId
                        });
                    }

                    await adminsRef.doc(adminDoc.id).update({
                        pin: newPin,
                        updated_at: Timestamp.now()
                    });

                    console.log(`✅ [Admin API ${requestId}] PIN updated successfully`);
                    return response.status(200).json({
                        success: true,
                        message: "PIN updated successfully.",
                        requestId
                    });
                }

                // LOGIN Mode
                if (!adminDoc) {
                    try {
                        console.log(`⚠️ [Admin API ${requestId}] No admin found. Seeding default '1234'...`);
                        await adminsRef.add({
                            pin: '1234',
                            updated_at: Timestamp.now()
                        });
                        adminData = { pin: '1234' };
                        console.log(`✅ [Admin API ${requestId}] Default admin seeded`);
                    } catch (seedError: any) {
                        console.error(`❌ [Admin API ${requestId}] Failed to seed admin:`, seedError);
                        return response.status(500).json({
                            error: "Database Write Failed (Seeding)",
                            details: seedError.message,
                            requestId
                        });
                    }
                }

                if (adminData?.pin === pin) {
                    console.log(`✅ [Admin API ${requestId}] Admin login successful`);
                    return response.status(200).json({
                        success: true,
                        requestId
                    });
                } else {
                    console.warn(`⚠️ [Admin API ${requestId}] Invalid PIN attempt`);
                    return response.status(401).json({
                        error: "Invalid PIN",
                        requestId
                    });
                }

            } catch (error: any) {
                console.error(`❌ [Admin API ${requestId}] Database Operation Error:`, {
                    error: error.message,
                    code: error.code,
                    timestamp: new Date().toISOString()
                });

                let detailedMessage = error.message;
                if (error.code === 5 || error.message.includes('NOT_FOUND') || error.message.includes('not found')) {
                    detailedMessage = "Firebase Project or Database '(default)' not found. Ensure Firestore is enabled in Firebase Console and Project ID matches your .env.local.";
                }

                return response.status(500).json({
                    error: 'Database Operation Error',
                    details: detailedMessage,
                    code: error.code,
                    requestId
                });
            }
        }

        return response.status(405).json({ error: 'Method not allowed' });

    } catch (criticalError: any) {
        console.error("🔥 Critical Handler Crash:", criticalError);
        return response.status(500).json({
            error: "Critical Server Error",
            message: "An unexpected error occurred in the admin handler.",
            details: criticalError.message
        });
    }
}
