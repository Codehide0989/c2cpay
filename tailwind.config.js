/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
        "./components/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                'neon-blue': '#00f3ff', // Brighter Cyan
                'neon-purple': '#d946ef', // Fuchsia 500
                'neon-rose': '#f43f5e', // Rose 500
                'glass-black': 'rgba(0, 0, 0, 0.7)',
                'glass-white': 'rgba(255, 255, 255, 0.1)',
                'dark-bg': '#050b14', // Richer Dark Blue/Black
            },
            animation: {
                'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'spin-slow': 'spin 8s linear infinite',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(0, 243, 255, 0.2)' },
                    '100%': { boxShadow: '0 0 20px rgba(0, 243, 255, 0.6)' },
                }
            }
        },
    },
    plugins: [],
}
