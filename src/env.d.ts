/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly DATABASE_URL: string;
    readonly GEMINI_API_KEY: string;
    readonly ADMIN_PIN: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
