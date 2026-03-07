import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
    site: 'https://c2cpay.vercel.app',
    integrations: [tailwind()],
    output: 'server',
    adapter: vercel({
        webAnalytics: { enabled: true },
    }),
});
