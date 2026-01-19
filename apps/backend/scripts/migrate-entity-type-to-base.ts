import { PrismaClient } from '@shared/prisma-client';
import { EntityAppliesToType, EntityType } from '@shared/static-data';

const prisma = new PrismaClient();

/**
 * Migration script to convert existing mechanics entities from EntityType.Other to EntityType.Base
 * 
 * This script:
 * 1. Finds all FeatureEntity records with EntityType.Other and appliesTo matching mechanics types
 * 2. Finds all FeatureEntity records with EntityType.Quantity and appliesTo = MovementSpeed (race base speed)
 * 3. Updates type to EntityType.Base (4)
 * 
 * Mechanics types to migrate:
 * - BaseAttackBonus, SavingThrow, HitDice, SkillPoints, Size, FavoredClass, LevelAdjustment
 * - SpellcastingProgression, CastingAbility, CastingType
 * - MovementSpeed (from EntityType.Quantity)
 * 
 * Usage:
 *   cd apps/backend
 *   npx tsx scripts/migrate-entity-type-to-base.ts
 */
async function migrateEntityTypeToBase() {
    console.log('Starting migration of mechanics entities from EntityType.Other/Quantity to EntityType.Base...\n');

    try {
        // Find all mechanics entities with EntityType.Other
        const otherMechanicsEntities = await prisma.featureEntity.findMany({
            where: {
                type: EntityType.Other,
                appliesTo: {
                    in: [
                        EntityAppliesToType.BaseAttackBonus,
                        EntityAppliesToType.SavingThrow,
                        EntityAppliesToType.HitDice,
                        EntityAppliesToType.SkillPoints,
                        EntityAppliesToType.Size,
                        EntityAppliesToType.FavoredClass,
                        EntityAppliesToType.LevelAdjustment,
                        EntityAppliesToType.SpellcastingProgression,
                        EntityAppliesToType.CastingAbility,
                        EntityAppliesToType.CastingType,
                    ],
                },
            },
        });

        console.log(`Found ${otherMechanicsEntities.length} EntityType.Other mechanics entities to migrate`);

        // Find all MovementSpeed entities with EntityType.Quantity (race base speed)
        const movementSpeedEntities = await prisma.featureEntity.findMany({
            where: {
                type: EntityType.Quantity,
                appliesTo: EntityAppliesToType.MovementSpeed,
            },
        });

        console.log(`Found ${movementSpeedEntities.length} EntityType.Quantity MovementSpeed entities to migrate`);

        const allEntities = [...otherMechanicsEntities, ...movementSpeedEntities];
        console.log(`Total entities to migrate: ${allEntities.length}\n`);

        if (allEntities.length === 0) {
            console.log('No entities to migrate. Exiting.');
            return;
        }

        let migrated = 0;
        for (const entity of allEntities) {
            try {
                await prisma.featureEntity.update({
                    where: { id: entity.id },
                    data: {
                        type: EntityType.Base,
                    },
                });
                migrated++;
            } catch (error) {
                console.error(`Error migrating entity ${entity.id}:`, error);
            }
        }

        console.log(`\nMigration complete!`);
        console.log(`Successfully migrated ${migrated} entities to EntityType.Base`);
        console.log(`Failed: ${allEntities.length - migrated}`);

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrateEntityTypeToBase()
    .then(() => {
        console.log('\nMigration script completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nMigration script failed:', error);
        process.exit(1);
    });
