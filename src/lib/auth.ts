
export const ADMIN_PIN = process.env.ADMIN_PIN || '1234';

export function isAuthorized(request: Request): boolean {
    const pin = request.headers.get('x-admin-pin');
    return pin === ADMIN_PIN;
}

export function jsonResponse(data: any, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export function unauthorizedResponse() {
    return jsonResponse({ error: 'Unauthorized' }, 401);
}
