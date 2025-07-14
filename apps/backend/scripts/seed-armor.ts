import { PrismaClient } from '@shared/prisma-client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

interface ArmorData {
    name: string;
    description: string | null;
    type: 'ARMOR';
    cost: string | null;
    weight: number | null;
    armor: {
        category: number;
        bonus: number | null;
        dexterityCap: number | null;
        checkPenalty: number | null;
        arcaneSpellFailure: number | null;
        speedCapThirty: number | null;
        speedCapTwenty: number | null;
    };
}

async function seedArmor() {
    try {
        console.log('Starting armor seeding...');

        // Read the armor JSON file
        const armorPath = path.join(__dirname, 'armor.json');
        const armorData: ArmorData[] = JSON.parse(fs.readFileSync(armorPath, 'utf8'));

        console.log(`Found ${armorData.length} armor items to process`);

        let insertedCount = 0;
        let skippedCount = 0;

        for (const armorItem of armorData) {
            try {
                // Check if item already exists by name
                const existingItem = await prisma.item.findFirst({
                    where: {
                        name: armorItem.name,
                        type: 'ARMOR'
                    }
                });

                if (existingItem) {
                    console.log(`Skipping ${armorItem.name} - already exists`);
                    skippedCount++;
                    continue;
                }

                // Create the item and armor in a transaction
                const result = await prisma.$transaction(async (tx) => {
                    // Create the item
                    const item = await tx.item.create({
                        data: {
                            name: armorItem.name,
                            description: armorItem.description,
                            type: armorItem.type,
                            cost: armorItem.cost,
                            weight: armorItem.weight,
                            quantity: null,
                        }
                    });

                    // Create the armor
                    const armor = await tx.armor.create({
                        data: {
                            id: item.id,
                            category: armorItem.armor.category,
                            bonus: armorItem.armor.bonus,
                            dexterityCap: armorItem.armor.dexterityCap,
                            checkPenalty: armorItem.armor.checkPenalty,
                            arcaneSpellFailure: armorItem.armor.arcaneSpellFailure,
                            speedCapThirty: armorItem.armor.speedCapThirty,
                            speedCapTwenty: armorItem.armor.speedCapTwenty,
                        }
                    });

                    return { item, armor };
                });

                console.log(`Inserted: ${armorItem.name} (ID: ${result.item.id})`);
                insertedCount++;

            } catch (error) {
                console.error(`Error processing ${armorItem.name}:`, error);
            }
        }

        console.log('\nSeeding completed!');
        console.log(`Inserted: ${insertedCount} armor items`);
        console.log(`Skipped: ${skippedCount} armor items (already existed)`);

    } catch (error) {
        console.error('Error during seeding:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding function
seedArmor()
    .then(() => {
        console.log('Armor seeding completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Armor seeding failed:', error);
        process.exit(1);
    }); 