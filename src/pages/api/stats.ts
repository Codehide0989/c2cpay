import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';
import { isAuthorized, jsonResponse, unauthorizedResponse } from '../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
    if (!isAuthorized(request)) return unauthorizedResponse();

    try {
        const totalPayments = await prisma.payment.count();
        const successCount = await prisma.payment.count({ where: { status: 'SUCCESS' } });
        const recentPayments = await prisma.payment.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        const successPayments = await prisma.payment.findMany({
            where: { status: 'SUCCESS' },
            select: { amount: true }
        });

        const totalAmount = successPayments.reduce((acc, p) => acc + parseFloat(p.amount || '0'), 0);

        return jsonResponse({
            total: totalPayments,
            successCount,
            totalAmount,
            recent: recentPayments
        });
    } catch (error) {
        return jsonResponse({ error: 'Failed' }, 500);
    }
};
