import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';
import crypto from 'crypto';

export const GET: APIRoute = async ({ request }) => {
    const adminPin = request.headers.get('x-admin-pin');
    const correctPin = process.env.ADMIN_PIN || '1234';

    if (adminPin !== correctPin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const keys = await prisma.apiKey.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                key: true,
                name: true,
                active: true,
                createdAt: true,
                // Never expose secret in list view
            }
        });
        return new Response(JSON.stringify({ keys }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
    }
};

export const POST: APIRoute = async ({ request }) => {
    const adminPin = request.headers.get('x-admin-pin');
    const correctPin = process.env.ADMIN_PIN || '1234';

    if (adminPin !== correctPin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    try {
        const body = await request.json();

        // Generate live key (public identifier) and secret (private)
        const liveKey = 'pk_live_' + crypto.randomBytes(20).toString('hex');
        const secret = 'sk_live_' + crypto.randomBytes(32).toString('hex');

        await prisma.apiKey.create({
            data: {
                name: body.name || 'New App Key',
                key: liveKey,
                secret: secret,
                active: true,
            }
        });

        // Return both key and secret — this is the ONLY time the secret is shown
        return new Response(JSON.stringify({
            success: true,
            liveKey,
            secret,
            name: body.name || 'New App Key',
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to generate key' }), { status: 500 });
    }
};

export const DELETE: APIRoute = async ({ request }) => {
    const adminPin = request.headers.get('x-admin-pin');
    const correctPin = process.env.ADMIN_PIN || '1234';

    if (adminPin !== correctPin) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
    }

    try {
        await prisma.apiKey.delete({ where: { id } });
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
    }
};
