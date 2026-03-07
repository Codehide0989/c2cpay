import { prisma } from '../lib/prisma';

export const getPayments = async (limit = 100) => {
    const payments = await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
    return payments.map(p => ({
        ...p,
        timestamp: p.createdAt.getTime(),
    }));
};

export const createPayment = async (data: any) => {
    return await prisma.payment.create({
        data: {
            id: data.id,
            amount: data.amount,
            vpa: data.vpa,
            status: data.status,
            utr: data.utr || null,
            method: data.method || null,
            details: data.details || null,
        }
    });
};
