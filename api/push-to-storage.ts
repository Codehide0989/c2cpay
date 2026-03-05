import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, storage, isFirebaseInitialized, hasFirebaseCredentials } from '../lib/firebase';

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
        if (!isFirebaseInitialized()) {
            return response.status(500).json({ error: 'Firebase not initialized' });
        }

        const adminsRef = db.collection('admins');
        const adminSnapshot = await adminsRef.limit(1).get();
        if (adminSnapshot.empty) {
            return response.status(401).json({ error: 'Admin setup required' });
        }
        const adminData = adminSnapshot.docs[0].data();
        if (adminData.pin !== pin) {
            return response.status(401).json({ error: 'Invalid PIN' });
        }

        console.log("📤 Starting database backup to Firebase Storage...");

        const collections = ['configs', 'payments', 'admins', 'apikeys'];
        const backupData: any = {};

        for (const colName of collections) {
            const snapshot = await db.collection(colName).get();
            backupData[colName] = snapshot.docs.map((doc: any) => ({
                id: doc.id,
                ...doc.data(),
                // Convert timestamps to ISO strings for serialization
                _timestamp: new Date().toISOString()
            }));
        }

        const backupJson = JSON.stringify(backupData, null, 2);
        const fileName = `backups/db-backup-${Date.now()}.json`;
        const file = storage.bucket().file(fileName);

        await file.save(backupJson, {
            contentType: 'application/json',
            metadata: {
                cacheControl: 'no-cache'
            }
        });

        console.log(`✅ Backup saved to ${fileName}`);

        return response.status(200).json({
            success: true,
            message: "All tables (collections) pushed to Firebase Storage successfully.",
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
