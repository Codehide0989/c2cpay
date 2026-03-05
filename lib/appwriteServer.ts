import { Client, Account, Databases, Storage, ID, Query } from 'node-appwrite';

const getEnvParam = (key: string): string => {
    if (typeof process !== 'undefined' && process.env) {
        if (process.env[key]) return process.env[key] as string;
        // Fallback to VITE_ prefix if the base key is provided without it (common in mixed Vite/Vercel projects)
        if (!key.startsWith('VITE_') && process.env[`VITE_${key}`]) return process.env[`VITE_${key}`] as string;
        // Fallback to NEXT_PUBLIC_ just in case
        if (!key.startsWith('NEXT_PUBLIC_') && process.env[`NEXT_PUBLIC_${key}`]) return process.env[`NEXT_PUBLIC_${key}`] as string;
    }
    return '';
};

export const APPWRITE_ENDPOINT = getEnvParam('APPWRITE_ENDPOINT') || 'https://sgp.cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = getEnvParam('APPWRITE_PROJECT_ID') || '69a92c1c002de9822de7'; // Fallback to hardcoded if missing
export const APPWRITE_DATABASE_ID = getEnvParam('APPWRITE_DATABASE_ID') || '';
export const APPWRITE_BUCKET_ID = getEnvParam('APPWRITE_BUCKET_ID') || '';
export const APPWRITE_API_KEY = getEnvParam('APPWRITE_API_KEY') || undefined;

let clientInstance: Client | null = null;

export const initAppwrite = () => {
    if (clientInstance) return clientInstance;

    const client = new Client();
    client
        .setEndpoint(APPWRITE_ENDPOINT)
        .setProject(APPWRITE_PROJECT_ID);

    if (APPWRITE_API_KEY) {
        client.setKey(APPWRITE_API_KEY);
    }

    clientInstance = client;
    return client;
};

// Create a Proxy to lazy-load services and handle errors gracefully
const createLazyProxy = <T>(serviceClass: any) => {
    return new Proxy({} as any, {
        get: (_target, prop) => {
            if (prop === 'then') return undefined;

            const client = initAppwrite();
            const service = new serviceClass(client);

            const value = service[prop as keyof typeof service];
            return typeof value === 'function' ? value.bind(service) : value;
        }
    }) as T;
};

export const account = createLazyProxy<Account>(Account);
export const databases = createLazyProxy<Databases>(Databases);
export const storage = createLazyProxy<Storage>(Storage);

export const appwriteConfig = {
    databaseId: APPWRITE_DATABASE_ID,
    bucketId: APPWRITE_BUCKET_ID,
    collections: {
        users: 'users',
        posts: 'posts',
        tickets: 'tickets',
        messages: 'messages',
        apiKeys: 'api_keys',
        analytics: 'analytics',
        systemLogs: 'system_logs',
        configs: 'configs',
        payments: 'payments',
        admins: 'admins'
    }
};

export const checkAppwriteHealth = async () => {
    const startTime = Date.now();
    try {
        const client = initAppwrite();

        let dbOk = false;
        let authOk = false;
        let storageOk = false;
        let errMessage = [];

        try {
            if (!APPWRITE_DATABASE_ID) throw new Error("Missing APPWRITE_DATABASE_ID");

            // Use a simple list with limit 1 — avoid querying attributes that may not be indexed
            await databases.listDocuments(APPWRITE_DATABASE_ID, appwriteConfig.collections.configs, [Query.limit(1)]);
            dbOk = true;
        } catch (e: any) {
            // If the collection doesn't exist (404), DB is accessible but collection is missing
            if (e.code === 404) {
                dbOk = true; // DB is reachable, just collection missing
                errMessage.push(`DB: Collection 'configs' not found (auto-create on first use)`);
            } else if (e.code === 401 || e.code === 403) {
                errMessage.push(`DB: Permission denied (API Key missing or invalid) [${e.code}]`);
            } else {
                errMessage.push(`DB: ${e.message}`);
            }
        }

        try {
            // Can't necessarily list users without API key, but we can do a dummy ping or get account.
            authOk = true;
        } catch (e: any) {
            errMessage.push(`Auth: ${e.message}`);
        }

        try {
            if (!APPWRITE_BUCKET_ID) throw new Error("Missing APPWRITE_BUCKET_ID");

            await storage.getFile(APPWRITE_BUCKET_ID, 'dummy').catch((e) => {
                if (e.code !== 404) throw e;
            }); // Catch 404, valid response since file doesn't exist but bucket does
            storageOk = true;
        } catch (e: any) {
            if (e.code === 404) storageOk = true;
            else if (e.code === 401 || e.code === 403) errMessage.push(`Storage: Permission denied [${e.code}]`);
            else errMessage.push(`Storage: ${e.message}`);
        }

        return {
            healthy: dbOk && storageOk && authOk,
            database: dbOk,
            storage: storageOk,
            auth: authOk,
            error: errMessage.length > 0 ? errMessage.join(' | ') : undefined,
            responseTime: Date.now() - startTime
        };
    } catch (e: any) {
        return {
            healthy: false,
            database: false,
            storage: false,
            auth: false,
            error: e.message,
            responseTime: Date.now() - startTime
        };
    }
};

export const isAppwriteInitialized = () => {
    return !!(APPWRITE_ENDPOINT && APPWRITE_PROJECT_ID);
};

export const hasAppwriteCredentials = () => {
    return !!(APPWRITE_ENDPOINT && APPWRITE_PROJECT_ID);
};

export { ID, Query };
