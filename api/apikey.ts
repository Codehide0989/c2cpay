import type { VercelRequest, VercelResponse } from '@vercel/node';
import { databases, initAppwrite, appwriteConfig, APPWRITE_DATABASE_ID, Query, ID } from '../lib/appwriteServer';
import * as crypto from 'crypto';

// Helper to validate API Key (for use in other endpoints)
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        const result = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            appwriteConfig.collections.apiKeys,
            [
                Query.equal('key', apiKey),
                Query.equal('isActive', true)
            ]
        );
        return result.documents.length > 0;
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
        try {
            initAppwrite();
        } catch (initError: any) {
            console.error("❌ API Key API - Appwrite Init Error:", initError.message);
            return response.status(500).json({
                error: "Database Connection Failed",
                message: "Could not connect to Appwrite.",
                details: initError.message
            });
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
            const result = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                appwriteConfig.collections.admins,
                [Query.limit(1)]
            );

            if (result.documents.length === 0) {
                console.error("❌ No admin found in database");
                return response.status(500).json({
                    error: "Configuration Error",
                    message: "Admin account not configured"
                });
            }

            const adminData = result.documents[0];
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

        // GET: List Keys
        if (request.method === 'GET') {
            try {
                console.log("📋 Fetching API keys list...");
                const result = await databases.listDocuments(
                    APPWRITE_DATABASE_ID,
                    appwriteConfig.collections.apiKeys,
                    [Query.orderDesc('$createdAt')]
                );
                const keys = result.documents.map(doc => ({
                    id: doc.$id,
                    ...doc,
                    key: `${doc.key.substring(0, 8)}...` // Mask for security in list
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
                    createdAt: new Date().toISOString()
                };

                const docRef = await databases.createDocument(
                    APPWRITE_DATABASE_ID,
                    appwriteConfig.collections.apiKeys,
                    ID.unique(),
                    newDoc
                );
                console.log(`✅ API key created successfully with ID: ${docRef.$id}`);

                return response.status(201).json({
                    success: true,
                    apiKey: newKey,
                    message: "Save this key! It won't be visible again.",
                    keyId: docRef.$id
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
                await databases.deleteDocument(
                    APPWRITE_DATABASE_ID,
                    appwriteConfig.collections.apiKeys,
                    id as string
                );
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
