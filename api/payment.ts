import type { VercelRequest, VercelResponse } from '@vercel/node';
import { db, isFirebaseInitialized, hasFirebaseCredentials, initFirebase } from '../lib/firebase';
import { validateApiKey } from './apikey';
import { Timestamp } from "firebase-admin/firestore";

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    try {
        if (!hasFirebaseCredentials()) {
            return response.status(500).json({ error: "Backend Config Error: Firebase Credentials Missing" });
        }

        try {
            if (!isFirebaseInitialized()) {
                initFirebase();
            }
        } catch (initError: any) {
            console.error("❌ Payment API - Firebase Init Error:", initError);
            return response.status(500).json({ error: "Database Connection Failed", details: initError.message });
        }

        // API Key Validation (Enforced for POST, maybe optional for GET if checking history?)
        // User said: "without api key integration not works". Usually integration = POST (create payment).
        if (request.method === 'POST') {
            const apiKey = request.headers['x-api-key'];
            if (!apiKey || typeof apiKey !== 'string') {
                return response.status(401).json({ error: "Missing API Key", message: "Include 'x-api-key' header in your request." });
            }
            if (!(await validateApiKey(apiKey))) {
                return response.status(403).json({ error: "Invalid API Key" });
            }
        }

        const paymentsRef = db.collection('payments');

        if (request.method === 'GET') {
            // ... existing GET ...
            try {
                // Return last 100 payments
                const snapshot = await paymentsRef.orderBy('timestamp', 'desc').limit(100).get();

                const history = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate().toISOString()
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

                await paymentsRef.add({
                    transactionId: id,
                    amount,
                    status,
                    method,
                    vpa,
                    utr,
                    details,
                    timestamp: Timestamp.now()
                });

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
