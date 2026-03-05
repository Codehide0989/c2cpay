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
        // 1. Explicitly check for credentials first (fast fail)
        if (!hasFirebaseCredentials()) {
            console.error(`❌ [Admin API ${requestId}] Missing Firebase credentials in Environment`);
            return response.status(500).json({
                error: "Environment Configuration Error",
                message: "Firebase credentials (Project ID, Client Email, or Private Key) are missing in Vercel environment variables.",
                requestId
            });
        }

        // 2. Initialize Firebase
        try {
            initFirebase();
        } catch (initError: any) {
            console.error(`❌ [Admin API ${requestId}] Firebase Admin Init Error:`, initError.message);
            return response.status(500).json({
                error: "Database Connection Error",
                message: "Failed to initialize database connection. Check if your Private Key is correct.",
                details: initError.message,
                requestId
            });
        }

        // Use the connection
        const adminsRef = db.collection('admins');

        // Verify PIN
        if (request.method === 'POST') {
            const { pin, action } = request.body || {};

            // Validate request body
            if (!request.body || typeof request.body !== 'object') {
                return response.status(400).json({
                    error: "Invalid Request",
                    message: "Request body must be a valid JSON object",
                    requestId
                });
            }

            if (!pin && action !== 'change_pin' && action !== 'setup') {
                return response.status(400).json({
                    error: "PIN is required",
                    requestId
                });
            }

            try {
                // Fetch first admin document
                const snapshot = await adminsRef.limit(1).get()
                    .catch(e => {
                        console.error(`❌ [Admin API ${requestId}] Firestore Get Failed:`, e.message);
                        throw new Error(`Firestore Access Failed: ${e.message}. Ensure Firestore is enabled in your project.`);
                    });

                let adminDoc = snapshot.empty ? null : snapshot.docs[0];
                let adminData = adminDoc ? adminDoc.data() : null;

                // SETUP Mode
                if (action === 'setup') {
                    if (!adminDoc) {
                        await adminsRef.add({
                            pin: pin || '1234',
                            updated_at: Timestamp.now()
                        });
                        return response.status(200).json({
                            success: true,
                            message: "Admin configured successfully.",
                            requestId
                        });
                    } else {
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
                        return response.status(404).json({
                            error: "Admin not found.",
                            requestId
                        });
                    }

                    if (adminData?.pin !== pin) {
                        return response.status(401).json({
                            error: "Current PIN is incorrect.",
                            requestId
                        });
                    }

                    if (!newPin || newPin.length < 4) {
                        return response.status(400).json({
                            error: "New PIN must be at least 4 digits.",
                            requestId
                        });
                    }

                    await adminsRef.doc(adminDoc.id).update({
                        pin: newPin,
                        updated_at: Timestamp.now()
                    });

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
                    } catch (seedError: any) {
                        return response.status(500).json({
                            error: "Database Write Failed (Seeding)",
                            details: seedError.message,
                            requestId
                        });
                    }
                }

                if (adminData?.pin === pin) {
                    return response.status(200).json({
                        success: true,
                        requestId
                    });
                } else {
                    return response.status(401).json({
                        error: "Invalid PIN",
                        requestId
                    });
                }

            } catch (error: any) {
                console.error(`❌ [Admin API ${requestId}] Database Operation Error:`, error);

                return response.status(500).json({
                    error: 'Database Operation Error',
                    message: "The server encountered an error while communicating with Firestore.",
                    details: error.message,
                    requestId
                });
            }
        }

        return response.status(405).json({ error: 'Method not allowed' });

    } catch (criticalError: any) {
        console.error("🔥 Critical Handler Crash:", criticalError);
        // Ensure we ALWAYS return JSON
        if (!response.writableEnded) {
            return response.status(500).json({
                error: "Critical Server Error",
                message: criticalError.message || "An unexpected error occurred.",
                requestId
            });
        }
    }
}

