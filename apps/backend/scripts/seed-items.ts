import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { PrismaClient } from '@shared/prisma-client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

interface ItemData {
    name: string;
    description: string | null;
    typeId: number;
    cost: string | null;
    weight: number | null;
}

async function seedItems() {
    try {
        console.log('Starting item seeding...');

        // Read the gear JSON file
        const itemsPath = path.join(__dirname, 'gear.json');
        const itemsData: ItemData[] = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));

        console.log(`Found ${itemsData.length} items to process`);

        let insertedCount = 0;
        let skippedCount = 0;

        for (const itemData of itemsData) {
            try {
                // Check if item already exists by name
                const existingItem = await prisma.item.findFirst({
                    where: {
                        name: itemData.name,
                        typeId: itemData.typeId
                    }
                });

                if (existingItem) {
                    console.log(`Skipping ${itemData.name} - already exists`);
                    skippedCount++;
                    continue;
                }

                // Create the item
                const item = await prisma.item.create({
                    data: {
                        name: itemData.name,
                        description: itemData.description,
                        typeId: itemData.typeId,
                        cost: itemData.cost,
                        weight: itemData.weight,
                        quantity: null,
                    }
                });

                console.log(`Inserted: ${itemData.name} (ID: ${item.id})`);
                insertedCount++;

            } catch (error) {
                console.error(`Error processing ${itemData.name}:`, error);
            }
        }

        console.log('\nSeeding completed!');
        console.log(`Inserted: ${insertedCount} items`);
        console.log(`Skipped: ${skippedCount} items (already existed)`);

    } catch (error) {
        console.error('Error during seeding:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding function
seedItems()
    .then(() => {
        console.log('Item seeding completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Item seeding failed:', error);
        process.exit(1);
    }); 
