import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, isFirebaseInitialized } from '../lib/firebase';
import { Timestamp } from "firebase-admin/firestore";

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed. Use POST to seed.' });
    }

    try {
        if (!isFirebaseInitialized()) {
            return response.status(500).json({ error: 'Firebase not initialized. Check your credentials.' });
        }

        console.log("🌱 Seeding database collections...");

        const results: any = {};
        const collectionsToSeed = ['configs', 'payments', 'admins', 'apikeys'];

        for (const colName of collectionsToSeed) {
            const snapshot = await db.collection(colName).limit(1).get();
            if (snapshot.empty) {
                console.log(`   Seeding ${colName}...`);
                let docData: any = { _isInitial: true, createdAt: Timestamp.now() };

                if (colName === 'admins') {
                    docData = { pin: '1234', updated_at: Timestamp.now() };
                } else if (colName === 'configs') {
                    docData = {
                        pa: 'shopc2c@upi',
                        pn: 'ShopC2C Store',
                        tn: 'Order Payment',
                        am: '0',
                        title: 'Secure Payment',
                        updatedAt: Timestamp.now()
                    };
                }

                const docRef = await db.collection(colName).add(docData);
                results[colName] = { status: 'seeded', id: docRef.id };
            } else {
                results[colName] = { status: 'exists', count: snapshot.size };
            }
        }

        return response.status(200).json({
            success: true,
            message: "Database seeding completed.",
            details: results
        });

    } catch (error: any) {
        console.error("❌ Seeding failed:", error);
        return response.status(500).json({
            error: "Seeding process failed",
            details: error.message,
            code: error.code
        });
    }
}
