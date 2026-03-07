import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding initial config...')
    const config = await prisma.config.upsert({
        where: { id: 'singleton' },
        update: {},
        create: {
            id: 'singleton',
            pa: 'shopc2c@upi',
            pn: 'ShopC2C Store',
            title: 'ShopC2C Secure Gateway',
            amountLocked: false,
        },
    })
    console.log({ config })

    console.log('Seeding initial API key...')
    await prisma.apiKey.upsert({
        where: { key: 'test-api-key-123' },
        update: {},
        create: {
            key: 'test-api-key-123',
            name: 'Development Key'
        }
    })

    console.log('Seed completed successfully.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
