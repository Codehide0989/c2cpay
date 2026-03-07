/// <reference types="astro/client" />

interface ImportMetaEnv {
    readonly DATABASE_URL: string;
    readonly GEMINI_API_KEY: string;
    readonly ADMIN_PIN: string;
    readonly PUBLIC_BASE_URL: string;
    readonly NEXT_PUBLIC_BASE_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
