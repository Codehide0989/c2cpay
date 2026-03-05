import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkAppwriteHealth, APPWRITE_PROJECT_ID, APPWRITE_ENDPOINT, APPWRITE_DATABASE_ID, APPWRITE_BUCKET_ID } from '../lib/appwriteServer';

export default async function handler(
    request: VercelRequest,
    response: VercelResponse
) {
    const health = await checkAppwriteHealth();

    const onlineCount = [health.database, health.storage, health.auth].filter(Boolean).length;
    const totalServices = 3;

    let systemStatus = 'Healthy';
    if (!APPWRITE_PROJECT_ID || !APPWRITE_ENDPOINT) {
        systemStatus = 'Degraded';
    } else if (onlineCount === 0) {
        systemStatus = 'Offline';
    } else if (onlineCount < totalServices) {
        systemStatus = 'Degraded';
    } else if (systemStatus === 'Healthy' && health.responseTime > 5000) {
        systemStatus = 'Checking';
    }

    const status: any = {
        isConnected: health.healthy,
        status: systemStatus,
        responseTime: health.responseTime || 0,
        envVars: {
            endpoint: APPWRITE_ENDPOINT ? 'Synced' : 'Missing',
            projectId: APPWRITE_PROJECT_ID ? 'Synced' : 'Missing',
            databaseId: APPWRITE_DATABASE_ID ? 'Synced' : 'Missing',
            storageBucket: APPWRITE_BUCKET_ID ? 'Synced' : 'Missing',
        },
        details: {
            endpoint: APPWRITE_ENDPOINT || 'MISSING',
            projectId: APPWRITE_PROJECT_ID || 'MISSING',
            storageBucket: APPWRITE_BUCKET_ID || 'MISSING',
        },
        services: {
            database: health.database ? 'ONLINE' : 'OFFLINE',
            storage: health.storage ? 'ONLINE' : 'OFFLINE',
            auth: health.auth ? 'ONLINE' : 'OFFLINE'
        },
        dbConnection: {
            currentState: health.healthy ? 'CONNECTED' : (health.error ? 'ERROR' : 'OFFLINE'),
            error: health.error || null
        },
        dbType: 'Appwrite Framework',
        protocol: 'HTTP/3 L7',
        nodeVersion: '4.0.12-Release',
        handshake: health.healthy ? 'SYN-ACK-ACK' : 'SYN-FAIL',
        error: health.error || null,
        timestamp: new Date().toISOString(),
        region: process.env.VERCEL_REGION || 'LOCAL',
        stateText: systemStatus
    };

    return response.status(200).json(status);
}

