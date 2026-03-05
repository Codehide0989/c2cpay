import type { VercelRequest, VercelResponse } from '@vercel/node';
import { databases, initAppwrite, appwriteConfig, APPWRITE_DATABASE_ID, Query, ID } from '../lib/appwriteServer';
import { validateApiKey } from './apikey';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    try {
        try {
            initAppwrite();
        } catch (initError: any) {
            console.error("❌ Payment API - Appwrite Init Error:", initError.message);
            return response.status(500).json({ error: "Database Connection Failed", details: initError.message });
        }

        // API Key Validation (Enforced for POST, maybe optional for GET if checking history?)
        if (request.method === 'POST') {
            const apiKey = request.headers['x-api-key'];
            if (!apiKey || typeof apiKey !== 'string') {
                return response.status(401).json({ error: "Missing API Key", message: "Include 'x-api-key' header in your request." });
            }
            if (!(await validateApiKey(apiKey))) {
                return response.status(403).json({ error: "Invalid API Key" });
            }
        }

        if (request.method === 'GET') {
            try {
                // Return last 100 payments
                const result = await databases.listDocuments(
                    APPWRITE_DATABASE_ID,
                    appwriteConfig.collections.payments,
                    [Query.orderDesc('timestamp'), Query.limit(100)]
                );

                const history = result.documents.map(doc => ({
                    id: doc.$id,
                    ...doc,
                    timestamp: doc.timestamp
                }));

                return response.status(200).json(history);
            } catch (error) {
                console.error("Payment history fetch error:", error);
                return response.status(500).json({ error: 'Failed to fetch history' });
            }
        }

        if (request.method === 'POST') {
            try {
                const { id, amount, status, method, vpa, utr, details } = request.body;

                await databases.createDocument(
                    APPWRITE_DATABASE_ID,
                    appwriteConfig.collections.payments,
                    ID.unique(),
                    {
                        transactionId: id,
                        amount,
                        status,
                        method,
                        vpa,
                        utr,
                        details,
                        timestamp: new Date().toISOString()
                    }
                );

                return response.status(200).json({ success: true });
            } catch (error) {
                console.error("Payment save error:", error);
                return response.status(500).json({ error: 'Failed to save payment' });
            }
        }

        return response.status(405).json({ error: 'Method not allowed' });

    } catch (criticalError: any) {
        console.error("🔥 Critical Payment Handler Crash:", criticalError);
        return response.status(500).json({ error: "Server Error", message: criticalError.message });
    }
}
