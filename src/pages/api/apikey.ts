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
        const keys = await prisma.apiKey.findMany();
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
        const apiKey = 'sk_' + crypto.randomBytes(24).toString('hex');
        const newKey = await prisma.apiKey.create({
            data: {
                name: body.name || 'New App Key',
                key: apiKey,
            }
        });

        return new Response(JSON.stringify({ success: true, apiKey }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
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
