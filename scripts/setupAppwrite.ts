import { Client, Databases, ID, Storage, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const BUCKET_ID = process.env.APPWRITE_BUCKET_ID;

if (!PROJECT_ID || !DATABASE_ID || !API_KEY) {
    console.error('❌ Error: Missing required environment variables:');
    if (!PROJECT_ID) console.error('- NEXT_PUBLIC_APPWRITE_PROJECT_ID');
    if (!DATABASE_ID) console.error('- APPWRITE_DATABASE_ID');
    if (!API_KEY) console.error('- APPWRITE_API_KEY');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

async function setup() {
    console.log('🚀 Starting Appwrite Database Setup...');
    console.log(`📍 Endpoint: ${ENDPOINT}`);
    console.log(`🆔 Project: ${PROJECT_ID}`);
    console.log(`💾 Database: ${DATABASE_ID}`);

    try {
        // 1. Check if database exists, if not create it (though usually it's pre-created)
        try {
            await databases.get(DATABASE_ID);
            console.log('✅ Database exists.');
        } catch (e) {
            console.log('🏗️ Creating database...');
            // In Appwrite Cloud, you can't usually create databases via API without a high-level key
            // but we'll try or just skip if it fails
            console.warn('⚠️ Could not verify/create database. Ensure it exists in console.');
        }

        const collections = [
            {
                id: 'configs',
                name: 'System Configs',
                attributes: [
                    { key: 'pa', type: 'string', size: 255, required: true },
                    { key: 'pn', type: 'string', size: 255, required: true },
                    { key: 'am', type: 'string', size: 50, required: false },
                    { key: 'tn', type: 'string', size: 255, required: false },
                    { key: 'title', type: 'string', size: 255, required: false },
                    { key: 'amountLocked', type: 'boolean', required: false, default: false },
                    { key: 'redirectUrl', type: 'string', size: 500, required: false },
                    { key: 'maintenanceMode', type: 'boolean', required: false, default: false },
                    { key: 'maintenanceMessage', type: 'string', size: 1000, required: false },
                    { key: 'maintenanceEndTime', type: 'integer', required: false }
                ]
            },
            {
                id: 'payments',
                name: 'Payments',
                attributes: [
                    { key: 'amount', type: 'string', size: 50, required: true },
                    { key: 'status', type: 'string', size: 50, required: true },
                    { key: 'utr', type: 'string', size: 255, required: false },
                    { key: 'vpa', type: 'string', size: 255, required: true },
                    { key: 'method', type: 'string', size: 50, required: true },
                    { key: 'details', type: 'string', size: 1000, required: false },
                    { key: 'timestamp', type: 'integer', required: true }
                ]
            },
            {
                id: 'admins',
                name: 'Administrators',
                attributes: [
                    { key: 'pin', type: 'string', size: 20, required: true },
                    { key: 'updated_at', type: 'string', size: 100, required: true }
                ]
            }
        ];

        for (const coll of collections) {
            console.log(`\n📦 Setting up collection: ${coll.id}...`);
            let collection;
            try {
                collection = await databases.getCollection(DATABASE_ID, coll.id);
                console.log(`✅ Collection ${coll.id} already exists.`);
            } catch (e) {
                console.log(`🏗️ Creating collection ${coll.id}...`);
                collection = await databases.createCollection(
                    DATABASE_ID,
                    coll.id,
                    coll.name,
                    [
                        Permission.read(Role.any()),
                        Permission.write(Role.any()), // For public apps, adjust permissions as needed
                    ]
                );
            }

            // Add attributes
            for (const attr of coll.attributes) {
                try {
                    if (attr.type === 'string') {
                        await databases.createStringAttribute(DATABASE_ID, coll.id, attr.key, attr.size!, attr.required, attr.default as any);
                    } else if (attr.type === 'boolean') {
                        await databases.createBooleanAttribute(DATABASE_ID, coll.id, attr.key, attr.required, attr.default as any);
                    } else if (attr.type === 'integer') {
                        await databases.createIntegerAttribute(DATABASE_ID, coll.id, attr.key, attr.required);
                    }
                    console.log(`  ➕ Added attribute: ${attr.key}`);
                } catch (e: any) {
                    if (e.code === 409) {
                        // console.log(`  ℹ️ Attribute ${attr.key} already exists.`);
                    } else {
                        console.error(`  ❌ Failed to add attribute ${attr.key}:`, e.message);
                    }
                }
            }
        }

        console.log('\n⏳ Waiting for attributes to build (10s)...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // 3. Seed Initial Data
        console.log('\n🌱 Seeding initial data...');

        // Seed Admin
        try {
            const admins = await databases.listDocuments(DATABASE_ID, 'admins');
            if (admins.total === 0) {
                await databases.createDocument(DATABASE_ID, 'admins', ID.unique(), {
                    pin: '1234',
                    updated_at: new Date().toISOString()
                });
                console.log('✅ Default admin PIN seeded (1234)');
            }
        } catch (e) {
            console.error('❌ Failed to seed admin:', e);
        }

        // Seed Config
        try {
            const configs = await databases.listDocuments(DATABASE_ID, 'configs');
            if (configs.total === 0) {
                await databases.createDocument(DATABASE_ID, 'configs', 'default', {
                    pa: 'shopc2c@upi',
                    pn: 'ShopC2C Payment Gateway',
                    am: '0',
                    tn: 'Payment for Services',
                    title: 'Secure Payment Gateway',
                    amountLocked: false,
                    maintenanceMode: false
                });
                console.log('✅ Default config seeded');
            }
        } catch (e) {
            console.error('❌ Failed to seed config:', e);
        }

        // 4. Setup Storage Bucket
        if (BUCKET_ID) {
            console.log(`\n🪣 Checking storage bucket: ${BUCKET_ID}...`);
            try {
                await storage.getBucket(BUCKET_ID);
                console.log('✅ Bucket exists.');
            } catch (e) {
                console.log('🏗️ Creating bucket...');
                try {
                    await storage.createBucket(
                        BUCKET_ID,
                        'Receipts',
                        [
                            Permission.read(Role.any()),
                            Permission.write(Role.any()),
                        ],
                        false, // fileSecurity
                        true, // enabled
                        undefined, // maximumFileSize
                        ['jpg', 'png', 'jpeg', 'pdf'] // allowedExtensions
                    );
                    console.log('✅ Bucket created.');
                } catch (err: any) {
                    console.error('❌ Failed to create bucket:', err.message);
                }
            }
        }

        console.log('\n✨ Setup Complete! All tables and initial data pushed to database.');
    } catch (error: any) {
        console.error('\n💥 Critical Setup Error:', error.message);
    }
}

setup();
