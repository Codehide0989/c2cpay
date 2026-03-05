import type { VercelRequest, VercelResponse } from '@vercel/node';
import { databases, storage, initAppwrite, isAppwriteInitialized, appwriteConfig, APPWRITE_DATABASE_ID, APPWRITE_BUCKET_ID, Query, ID } from '../lib/appwriteServer';
import { InputFile } from 'node-appwrite/file';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    // Verify Admin PIN
    const { pin } = request.body;
    if (!pin) {
        return response.status(401).json({ error: 'Admin PIN required' });
    }

    try {
        if (!isAppwriteInitialized()) {
            return response.status(500).json({ error: 'Appwrite not initialized' });
        }

        const result = await databases.listDocuments(
            APPWRITE_DATABASE_ID,
            appwriteConfig.collections.admins,
            [Query.limit(1)]
        );

        if (result.documents.length === 0) {
            return response.status(401).json({ error: 'Admin setup required' });
        }
        const adminData = result.documents[0];
        if (adminData.pin !== pin) {
            return response.status(401).json({ error: 'Invalid PIN' });
        }

        console.log("📤 Starting database backup to Appwrite Storage...");

        const collections = ['configs', 'payments', 'admins', 'apiKeys']; // Check mapped name
        const backupData: any = {};

        for (const colName of collections) {
            const collectionId = (appwriteConfig.collections as any)[colName];
            try {
                const snapshot = await databases.listDocuments(APPWRITE_DATABASE_ID, collectionId);
                backupData[colName] = snapshot.documents.map((doc: any) => ({
                    id: doc.$id,
                    ...doc,
                    _timestamp: new Date().toISOString()
                }));
            } catch (e: any) {
                console.warn(`Could not export collection ${colName}`, e.message);
            }
        }

        const backupJson = JSON.stringify(backupData, null, 2);
        const fileName = `db-backup-${Date.now()}.json`;

        // Convert to buffered file for node-appwrite
        const buffer = Buffer.from(backupJson, 'utf8');

        await storage.createFile(
            APPWRITE_BUCKET_ID,
            ID.unique(),
            InputFile.fromBuffer(buffer, fileName)
        );

        console.log(`✅ Backup saved to ${fileName}`);

        return response.status(200).json({
            success: true,
            message: "All tables (collections) pushed to Appwrite Storage successfully.",
            location: fileName,
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("❌ Backup failed:", error);
        return response.status(500).json({
            error: "Backup process failed",
            details: error.message
        });
    }
}
