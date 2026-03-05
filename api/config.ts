import type { VercelRequest, VercelResponse } from '@vercel/node';
import { databases, initAppwrite, appwriteConfig, APPWRITE_DATABASE_ID, Query, ID } from '../lib/appwriteServer';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    try {
        initAppwrite();
    } catch (initError: any) {
        return response.status(500).json({
            error: "Backend Error: Appwrite not initialized",
            message: "Appwrite connection failed.",
            details: initError.message
        });
    }

    try {
        if (request.method === 'GET') {
            const result = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                appwriteConfig.collections.configs,
                [Query.orderDesc('$updatedAt'), Query.limit(1)]
            );

            if (result.documents.length > 0) {
                const docData = result.documents[0];
                return response.status(200).json({ id: docData.$id, ...docData });
            }
            return response.status(200).json({});
        }

        if (request.method === 'POST') {
            const { pa, pn, tn, am, title, amountLocked, redirectUrl, maintenanceMode, maintenanceMessage, maintenanceEndTime } = request.body;

            console.log('📝 Saving config:', { pa, pn, tn, am, title, amountLocked, redirectUrl, maintenanceMode, maintenanceMessage, maintenanceEndTime });

            // Check for existing config to update
            const result = await databases.listDocuments(
                APPWRITE_DATABASE_ID,
                appwriteConfig.collections.configs,
                [Query.orderDesc('$updatedAt'), Query.limit(1)]
            );

            // Build data object
            const dataToSave: any = {
                pa: pa || 'shopc2c@upi',
                pn: pn || 'ShopC2C Store',
                tn: tn || 'Order Payment',
                am: am || '0',
                title: title || 'Secure Payment',
                amountLocked: amountLocked === true,
                maintenanceMode: maintenanceMode === true,
                maintenanceMessage: maintenanceMessage || ''
            };

            if (maintenanceEndTime !== undefined) {
                dataToSave.maintenanceEndTime = maintenanceEndTime;
            }

            if (redirectUrl && redirectUrl.trim() !== '') {
                dataToSave.redirectUrl = redirectUrl;
            }

            console.log('✅ Appwrite data prepared:', dataToSave);

            if (result.documents.length > 0) {
                // Update existing
                const docId = result.documents[0].$id;
                await databases.updateDocument(
                    APPWRITE_DATABASE_ID,
                    appwriteConfig.collections.configs,
                    docId,
                    dataToSave
                );
                console.log('✅ Config updated successfully');
                return response.status(200).json({ id: docId, ...dataToSave });
            } else {
                // Create new
                const docRef = await databases.createDocument(
                    APPWRITE_DATABASE_ID,
                    appwriteConfig.collections.configs,
                    ID.unique(),
                    dataToSave
                );
                console.log('✅ Config created successfully');
                return response.status(200).json({ id: docRef.$id, ...dataToSave });
            }
        }

        return response.status(405).json({ error: 'Method not allowed' });

    } catch (error: any) {
        console.error("Critical Error in /api/config:", error);

        return response.status(500).json({
            error: "Internal Server Error",
            details: error.message
        });
    }
}
