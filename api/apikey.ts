import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, hasFirebaseCredentials, isFirebaseInitialized } from '../lib/firebase';
import { Timestamp } from "firebase-admin/firestore";
import * as crypto from 'crypto';

// Helper to validate API Key (for use in other endpoints)
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        const snapshot = await db.collection('api_keys')
            .where('key', '==', apiKey)
            .where('isActive', '==', true)
            .get();
        return !snapshot.empty;
    } catch (e) {
        console.error("❌ API Key Validation Failed:", e);
        return false;
    }
};

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    console.log(`[API Key Handler] ${request.method} ${request.url}`);

    try {
        // Check Firebase credentials first
        if (!hasFirebaseCredentials()) {
            console.error("❌ Firebase credentials missing");
            return response.status(500).json({ 
                error: "Server Configuration Error",
                message: "Firebase credentials are not configured properly.",
                details: "Contact administrator to set up FIREBASE_PROJECT_ID, CLIENT_EMAIL, and PRIVATE_KEY"
            });
        }

        // Verify Firebase is initialized
        if (!isFirebaseInitialized()) {
            console.warn("⚠️ Firebase not initialized, attempting initialization...");
            try {
                // Trigger initialization through db access
                await db.collection('_health').limit(1).get();
            } catch (initError: any) {
                console.error("❌ Firebase initialization failed:", initError);
                return response.status(500).json({
                    error: "Database Connection Failed",
                    message: "Could not connect to Firebase.",
                    details: initError.message
                });
            }
        }

        // 1. Authenticate Admin
        const adminPin = request.headers['x-admin-pin'] as string;

        if (!adminPin) {
            console.warn("⚠️ Missing admin PIN in request headers");
            return response.status(401).json({ 
                error: "Unauthorized",
                message: "Admin PIN required in x-admin-pin header"
            });
        }

        try {
            // Verify PIN against DB
            const adminsRef = db.collection('admins');
            const snapshot = await adminsRef.limit(1).get();
            
            if (snapshot.empty) {
                console.error("❌ No admin found in database");
                return response.status(500).json({ 
                    error: "Configuration Error",
                    message: "Admin account not configured"
                });
            }

            const adminData = snapshot.docs[0].data();
            if (adminData.pin !== adminPin) {
                console.warn("⚠️ Invalid PIN attempt");
                return response.status(401).json({ 
                    error: "Unauthorized",
                    message: "Invalid admin PIN"
                });
            }

            console.log("✅ Admin authenticated successfully");
        } catch (authError: any) {
            console.error("❌ Auth verification error:", authError);
            return response.status(500).json({ 
                error: "Authentication Failed",
                message: "Could not verify admin credentials",
                details: authError.message
            });
        }

        const keysCollection = db.collection('api_keys');

        // GET: List Keys
        if (request.method === 'GET') {
            try {
                console.log("📋 Fetching API keys list...");
                const snapshot = await keysCollection.orderBy('createdAt', 'desc').get();
                const keys = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    key: `${doc.data().key.substring(0, 8)}...` // Mask for security in list
                }));
                console.log(`✅ Retrieved ${keys.length} API keys`);
                return response.status(200).json({ keys });
            } catch (e: any) {
                console.error("❌ Error fetching API keys:", e);
                return response.status(500).json({ 
                    error: "Database Error",
                    message: "Failed to retrieve API keys",
                    details: e.message
                });
            }
        }

        // POST: Generate New Key
        if (request.method === 'POST') {
            try {
                const { name } = request.body || {};
                
                if (!name || name.trim() === '') {
                    console.warn("⚠️ API key generation attempted without name");
                    return response.status(400).json({ 
                        error: "Validation Error",
                        message: "API key name is required"
                    });
                }

                console.log(`🔑 Generating new API key: "${name}"`);
                const newKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;

                const newDoc = {
                    key: newKey,
                    name: name.trim(),
                    isActive: true,
                    createdAt: Timestamp.now()
                };

                const docRef = await keysCollection.add(newDoc);
                console.log(`✅ API key created successfully with ID: ${docRef.id}`);

                return response.status(201).json({ 
                    success: true, 
                    apiKey: newKey, 
                    message: "Save this key! It won't be visible again.",
                    keyId: docRef.id
                });
            } catch (e: any) {
                console.error("❌ Error generating API key:", e);
                return response.status(500).json({ 
                    error: "Generation Failed",
                    message: "Could not generate API key",
                    details: e.message
                });
            }
        }

        // DELETE: Revoke Key
        if (request.method === 'DELETE') {
            try {
                const { id } = request.query;
                
                if (!id) {
                    console.warn("⚠️ Delete attempted without key ID");
                    return response.status(400).json({ 
                        error: "Validation Error",
                        message: "Key ID is required"
                    });
                }

                console.log(`🗑️ Deleting API key: ${id}`);
                await keysCollection.doc(id as string).delete();
                console.log(`✅ API key deleted successfully`);
                
                return response.status(200).json({ success: true, message: "API key revoked" });
            } catch (e: any) {
                console.error("❌ Error deleting API key:", e);
                return response.status(500).json({ 
                    error: "Deletion Failed",
                    message: "Could not revoke API key",
                    details: e.message
                });
            }
        }

        return response.status(405).json({ error: 'Method not allowed' });

    } catch (criticalError: any) {
        console.error("🔥 Critical error in API key handler:", criticalError);
        return response.status(500).json({
            error: "Critical Server Error",
            message: "An unexpected error occurred",
            details: criticalError.message
        });
    }
}
