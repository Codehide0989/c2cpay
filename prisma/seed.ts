import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

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
    const devLiveKey = 'pk_live_' + crypto.randomBytes(20).toString('hex')
    const devSecret = 'sk_live_' + crypto.randomBytes(32).toString('hex')

    await prisma.apiKey.upsert({
        where: { key: 'pk_live_dev_test_key_000000000000' },
        update: {},
        create: {
            key: 'pk_live_dev_test_key_000000000000',
            secret: 'sk_live_dev_test_secret_0000000000000000000000000000000000',
            name: 'Development Key',
            active: true,
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
