import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';

export const GET: APIRoute = async () => {
    try {
        // Check DB connection
        await prisma.$queryRaw`SELECT 1`;
        return new Response(JSON.stringify({ isConnected: true, status: 'healthy', env: 'production' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ isConnected: false, status: 'error', error: String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
