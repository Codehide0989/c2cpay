import { Client, Account, Databases, Storage } from "appwrite";

const getEnvVar = (key: string, viteVar: string | undefined, fallback: string = ""): string => {
  // Check Node.js process.env first (for server-side / Next.js)
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // Then check statically provided Vite variable
  if (viteVar) {
    return viteVar;
  }
  return fallback;
};

// Hardcoded Appwrite project details (as requested), but allow overrides
const APPWRITE_ENDPOINT = getEnvVar("APPWRITE_ENDPOINT", typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_APPWRITE_ENDPOINT : undefined, "https://cloud.appwrite.io/v1");
const APPWRITE_PROJECT_ID = getEnvVar("APPWRITE_PROJECT_ID", typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_APPWRITE_PROJECT_ID : undefined, "69a92c1c002de9822de7");

export const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const appwriteConfig = {
  endpoint: APPWRITE_ENDPOINT,
  projectId: APPWRITE_PROJECT_ID,
  databaseId: getEnvVar("APPWRITE_DATABASE_ID", typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_APPWRITE_DATABASE_ID : undefined, "YOUR_DATABASE_ID"),
  bucketId: getEnvVar("APPWRITE_BUCKET_ID", typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_APPWRITE_BUCKET_ID : undefined, "YOUR_BUCKET_ID"),
  collections: {
    users: "users",
    posts: "posts",
    tickets: "tickets",
    messages: "messages",
    apiKeys: "api_keys",
    analytics: "analytics",
    systemLogs: "system_logs",

    // Existing shopc2c collections to maintain logic
    configs: "configs",
    payments: "payments",
    admins: "admins",
    apikeys: "api_keys" // mapped
  }
};

export default client;
