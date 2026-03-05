import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { IncomingMessage } from 'http';

// Load env vars from .env and .env.local in root
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const app = express();
app.use(cors());
app.use(express.json());

// Root route - defined at the top level to fix "Cannot GET /"
app.get('/', (req, res) => {
    res.send(`
        <html>
            <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0f172a; color: white;">
                <div style="padding: 2rem; border: 1px solid #1e293b; border-radius: 1rem; background: #1e293b; text-align: center;">
                    <h1 style="color: #00f3ff;">ShopC2C API Server</h1>
                    <p>Status: <span style="color: #10b981;">Online & Running</span></p>
                    <p style="color: #94a3b8; font-size: 0.875rem;">This is the backend server. The frontend is running on <a href="http://localhost:5173" style="color: #00f3ff;">http://localhost:5173</a></p>
                    <div style="margin-top: 1rem; font-size: 0.75rem; color: #64748b;">
                        Try <a href="/api/health" style="color: #64748b; text-decoration: underline;">/api/health</a> to check database status
                    </div>
                </div>
            </body>
        </html>
    `);
});

// Wrap in async function to allow await
async function startServer() {
    const adminHandler = (await import('../api/admin')).default;
    const apikeyHandler = (await import('../api/apikey')).default;
    const configHandler = (await import('../api/config')).default;
    const statusHandler = (await import('../api/status')).default;
    const paymentHandler = (await import('../api/payment')).default;
    const verifyHandler = (await import('../api/verify')).default;
    const pushToStorageHandler = (await import('../api/push-to-storage')).default;

    console.log("-----------------------------------------");
    console.log("   Local API Server Startup Debug Info");
    console.log("-----------------------------------------");
    console.log(`> Loading environment variables...`);
    console.log(`> APPWRITE_ENDPOINT found: ${!!process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}`);
    if (process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) {
        console.log(`> APPWRITE_PROJECT_ID: ${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`);
    } else {
        console.warn("⚠️ WARNING: APPWRITE config is missing! DB connections will fail.");
    }
    console.log("-----------------------------------------");

    // Adapter to make Vercel functions compatible with Express
    const adapt = (handler: any) => async (req: any, res: any) => {
        // Vercel helper properties
        // Express already provides req.query and req.body.

        // Polyfill cookies if not present
        if (!req.cookies) {
            req.cookies = {};
            if (req.headers.cookie) {
                try {
                    req.headers.cookie.split(';').forEach((cookie: string) => {
                        const parts = cookie.split('=');
                        const name = parts[0].trim();
                        const value = parts[1] ? parts[1].trim() : '';
                        req.cookies[name] = value;
                    });
                } catch (e) {
                    // ignore
                }
            }
        }

        try {
            await handler(req, res);
        } catch (e: any) {
            console.error(`Error in ${req.path}:`, e);
            if (!res.headersSent) {
                res.status(500).json({ error: e.message || "Internal Server Error" });
            }
        }
    };

    // Vercel Function Endpoints
    app.all('/api/admin', adapt(adminHandler));
    app.all('/api/apikey', adapt(apikeyHandler));
    app.all('/api/config', adapt(configHandler));
    app.all('/api/status', adapt(statusHandler));
    app.all('/api/payment', adapt(paymentHandler));
    app.all('/api/verify', adapt(verifyHandler));
    app.all('/api/push-to-storage', adapt(pushToStorageHandler));


    const PORT = 3001;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ Local API Server running on http://localhost:${PORT}`);
        console.log(`   Admin Endpoint: http://localhost:${PORT}/api/admin`);
        console.log(`   API Key Endpoint: http://localhost:${PORT}/api/apikey`);
    });
}

startServer();
