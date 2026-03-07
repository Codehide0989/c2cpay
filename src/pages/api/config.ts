import type { APIRoute } from 'astro';
import { prisma } from '../../lib/prisma';
import { isAuthorized, jsonResponse, unauthorizedResponse } from '../../lib/auth';

export const GET: APIRoute = async ({ request }) => {
    if (!isAuthorized(request)) return unauthorizedResponse();

    try {
        const config = await prisma.config.findUnique({
            where: { id: 'singleton' },
        });

        if (!config) {
            return jsonResponse({
                pa: 'shopc2c@upi',
                pn: 'ShopC2C Store',
                title: 'Secure Payment',
                amountLocked: false,
            });
        }

        return jsonResponse(config);
    } catch (error) {
        return jsonResponse({ error: 'Failed to fetch config' }, 500);
    }
};

export const POST: APIRoute = async ({ request }) => {
    if (!isAuthorized(request)) return unauthorizedResponse();

    try {
        const body = await request.json();
        const config = await prisma.config.upsert({
            where: { id: 'singleton' },
            update: {
                pa: body.pa,
                pn: body.pn,
                am: body.am || null,
                tn: body.tn || null,
                title: body.title || null,
                amountLocked: body.amountLocked || false,
                redirectUrl: body.redirectUrl || null,
                maintenanceMode: body.maintenanceMode || false,
                maintenanceMessage: body.maintenanceMessage || null,
                maintenanceEndTime: body.maintenanceEndTime || null,
            },
            create: {
                id: 'singleton',
                pa: body.pa || 'test@upi',
                pn: body.pn || 'Test',
                am: body.am || null,
                tn: body.tn || null,
                title: body.title || null,
                amountLocked: body.amountLocked || false,
                redirectUrl: body.redirectUrl || null,
                maintenanceMode: body.maintenanceMode || false,
                maintenanceMessage: body.maintenanceMessage || null,
                maintenanceEndTime: body.maintenanceEndTime || null,
            }
        });

        return jsonResponse(config);
    } catch (error: any) {
        return jsonResponse({ error: error.message }, 500);
    }
};
