import type { APIRoute } from 'astro';
import { verifyPin, changePin } from '../../services/adminService';

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const action = body.action;
        const pin = body.pin;

        if (action === 'verify') {
            if (verifyPin(pin)) {
                return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } else {
                return new Response(JSON.stringify({ success: false, error: 'Invalid PIN' }), { status: 401 });
            }
        }

        if (action === 'change') {
            const newPin = body.newPin;
            if (changePin(pin, newPin)) {
                return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            } else {
                return new Response(JSON.stringify({ success: false, error: 'Invalid current PIN or new PIN too short' }), { status: 400 });
            }
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 });
    }
};
