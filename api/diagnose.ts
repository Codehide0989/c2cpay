import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkAppwriteHealth } from '../lib/appwriteServer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const health = await checkAppwriteHealth();

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    status: health.healthy ? 'ok' : 'error',
    message: health.healthy ? 'API and Database are operational' : 'System degraded',
    ...health,
    timestamp: new Date().toISOString(),
  });
}
