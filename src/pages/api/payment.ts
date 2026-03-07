import type { APIRoute } from 'astro';
import { getPayments, createPayment } from '../../services/paymentService';
import { isAuthorized, jsonResponse, unauthorizedResponse } from '../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
    if (!isAuthorized(request)) return unauthorizedResponse();

    try {
        const formatted = await getPayments(100);
        return jsonResponse(formatted);
    } catch (error) {
        return jsonResponse({ error: 'Failed to fetch payments' }, 500);
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const payment = await createPayment(body);
        return jsonResponse({ success: true, payment });
    } catch (error: any) {
        return jsonResponse({ success: false, error: error.message }, 500);
    }
};
