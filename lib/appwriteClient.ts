import { Client, Account, Databases, Storage } from 'appwrite';

const getEnvParam = (key: string): string => {
    // Check Next.js / Vite style vars
    if (typeof process !== 'undefined' && process.env) {
        if (process.env[key]) return process.env[key] as string;
    }
    // Check Vite import.meta.env
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
        if ((import.meta as any).env[key]) return (import.meta as any).env[key] as string;
    }
    return '';
};

const APPWRITE_ENDPOINT = getEnvParam('NEXT_PUBLIC_APPWRITE_ENDPOINT') || getEnvParam('APPWRITE_ENDPOINT') || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = getEnvParam('NEXT_PUBLIC_APPWRITE_PROJECT_ID') || getEnvParam('APPWRITE_PROJECT_ID') || 'YOUR_PROJECT_ID';

const client = new Client();
client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const appwriteConfig = {
    endpoint: APPWRITE_ENDPOINT,
    projectId: APPWRITE_PROJECT_ID,
    databaseId: getEnvParam('APPWRITE_DATABASE_ID') || 'YOUR_DATABASE_ID',
    bucketId: getEnvParam('APPWRITE_BUCKET_ID') || 'YOUR_BUCKET_ID',
    collections: {
        users: 'users',
        posts: 'posts',
        tickets: 'tickets',
        messages: 'messages',
        apiKeys: 'api_keys',
        analytics: 'analytics',
        systemLogs: 'system_logs',

        // Existing shopc2c collections to maintain logic
        configs: 'configs',
        payments: 'payments',
        admins: 'admins',
        apikeys: 'api_keys' // mapped
    }
};

export default client;
