import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ShopC2C API Server</title>
        <style>
            html, body { margin: 0; padding: 0; height: 100%; font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; overflow: hidden; }
            .container { text-align: center; position: relative; z-index: 10; padding: 2rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); backdrop-filter: blur(10px); max-width: 500px; width: 90%; }
            h1 { font-size: 3rem; margin: 0 0 1rem; background: linear-gradient(to right, #22d3ee, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            p { color: #94a3b8; font-size: 1.1rem; line-height: 1.6; margin-bottom: 2rem; }
            .status-indicator { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); border-radius: 9999px; color: #4ade80; font-weight: 600; font-size: 0.9rem; margin-bottom: 2rem; }
            .status-dot { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80; animation: pulse 2s infinite; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; text-align: left; }
            .card { background: rgba(0, 0, 0, 0.2); padding: 1rem; border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.05); transition: transform 0.2s; }
            .card:hover { transform: translateY(-2px); background: rgba(0, 0, 0, 0.3); }
            .card-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; display: block; margin-bottom: 0.25rem; }
            .card-value { font-family: monospace; color: #e2e8f0; font-size: 0.9rem; }
            @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
            .bg-glow { position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(34, 211, 238, 0.1) 0%, rgba(0,0,0,0) 70%); top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 0; pointer-events: none; }
        </style>
    </head>
    <body>
        <div class="bg-glow"></div>
        <div class="container">
            <div class="status-indicator">
                <div class="status-dot"></div>
                System Operational
            </div>
            <h1>ShopC2C API</h1>
            <p>Secure Payment Gateway Backend is initializing and handling requests securely.</p>
            
            <div class="grid">
                <div class="card">
                    <span class="card-label">Region</span>
                    <span class="card-value">${process.env.VERCEL_REGION || 'DEV'}</span>
                </div>
                <div class="card">
                    <span class="card-label">Environment</span>
                    <span class="card-value">${process.env.VERCEL_ENV || 'development'}</span>
                </div>
                <div class="card">
                    <span class="card-label">Node Version</span>
                    <span class="card-value">${process.version}</span>
                </div>
                <div class="card">
                    <span class="card-label">Endpoints</span>
                    <span class="card-value"><a href="/api/status" style="color: #22d3ee; text-decoration: none;">/status</a> Check</span>
                </div>
            </div>
            <p style="margin-top: 2rem; font-size: 0.8rem; opacity: 0.5;">
                &copy; 2025 ShopC2C Inc. All systems normal.
            </p>
        </div>
    </body>
    </html>
  `;

    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
}
