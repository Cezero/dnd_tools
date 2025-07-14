import { PrismaClient } from '@shared/prisma-client';
import { DAMAGE_TYPES } from '@shared/static-data/src/ItemData';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Damage type mapping from descriptive strings to numeric format
const damageTypeMap: { [key: string]: string } = {
  'Bludgeoning': DAMAGE_TYPES[1].id.toString(),
  'Piercing': DAMAGE_TYPES[2].id.toString(), 
  'Slashing': DAMAGE_TYPES[3].id.toString(),
  'Piercing or slashing': `${DAMAGE_TYPES[2].id}|${DAMAGE_TYPES[3].id}`,
  'Bludgeoning and piercing': `${DAMAGE_TYPES[1].id}&${DAMAGE_TYPES[2].id}`,
  'Slashing or piercing': `${DAMAGE_TYPES[3].id}|${DAMAGE_TYPES[2].id}`
};

function convertDamageType(descriptiveType: string | null): string | null {
  if (!descriptiveType) return null;
  return damageTypeMap[descriptiveType] || descriptiveType;
}

const prisma = new PrismaClient();

interface WeaponData {
    item: {
        name: string;
        description: string | null;
        type: 'WEAPON';
        cost: number | null;
        weight: number | null;
        quantity: number | null;
    };
    weapon: {
        category: number;
        type: number;
        attackBonus: number | null;
        damageSmall: string | null;
        damageMedium: string | null;
        critical: string | null;
        range: string | null;
        damageType: string | null;
        reach: boolean;
        double: boolean;
        nonlethal: boolean;
    };
}

async function seedWeapons() {
    try {
        console.log('Starting weapon seeding...');

        // Read the weapons JSON file
        const weaponsPath = path.join(__dirname, 'weapons.json');
        const weaponsData: WeaponData[] = JSON.parse(fs.readFileSync(weaponsPath, 'utf8'));

        console.log(`Found ${weaponsData.length} weapons to process`);

        let insertedCount = 0;
        let skippedCount = 0;

        for (const weaponData of weaponsData) {
            try {
                // Check if item already exists by name
                const existingItem = await prisma.item.findFirst({
                    where: {
                        name: weaponData.item.name,
                        type: 'WEAPON'
                    }
                });

                if (existingItem) {
                    console.log(`Skipping ${weaponData.item.name} - already exists`);
                    skippedCount++;
                    continue;
                }

                // Create the item and weapon in a transaction
                const result = await prisma.$transaction(async (tx) => {
                    // Create the item
                    const item = await tx.item.create({
                        data: {
                            name: weaponData.item.name,
                            description: weaponData.item.description,
                            type: weaponData.item.type,
                            cost: weaponData.item.cost,
                            weight: weaponData.item.weight,
                            quantity: weaponData.item.quantity,
                        }
                    });

                              // Create the weapon
          const weapon = await tx.weapon.create({
            data: {
              id: item.id,
              category: weaponData.weapon.category,
              type: weaponData.weapon.type,
              attackBonus: weaponData.weapon.attackBonus,
              damageSmall: weaponData.weapon.damageSmall,
              damageMedium: weaponData.weapon.damageMedium,
              critical: weaponData.weapon.critical,
              range: weaponData.weapon.range,
              damageType: convertDamageType(weaponData.weapon.damageType), // Converts to numeric format like "1", "2", "2|3"
              reach: weaponData.weapon.reach,
              double: weaponData.weapon.double,
              nonlethal: weaponData.weapon.nonlethal,
            }
          });

                    return { item, weapon };
                });

                console.log(`Inserted: ${weaponData.item.name} (ID: ${result.item.id})`);
                insertedCount++;

            } catch (error) {
                console.error(`Error processing ${weaponData.item.name}:`, error);
            }
        }

        console.log('\nSeeding completed!');
        console.log(`Inserted: ${insertedCount} weapons`);
        console.log(`Skipped: ${skippedCount} weapons (already existed)`);

    } catch (error) {
        console.error('Error during seeding:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the seeding function
seedWeapons()
    .then(() => {
        console.log('Weapon seeding completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Weapon seeding failed:', error);
        process.exit(1);
    }); 