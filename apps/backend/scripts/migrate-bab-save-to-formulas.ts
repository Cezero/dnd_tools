import { PrismaClient } from '@shared/prisma-client';
import { EntityAppliesToType, SavingThrowId, FormulaId, ProgressionType, EntityType } from '@shared/static-data';

const prisma = new PrismaClient();

/**
 * Migration script to convert existing ProgressionType enum values to formula-based entities
 * 
 * This script:
 * 1. Finds all FeatureEntity records with BAB (appliesToId = ProgressionType)
 * 2. Finds all FeatureEntity records with Saving Throws (appliesToSubId = ProgressionType)
 * 3. Creates FeatureFormulaParams records for each
 * 4. Updates entities to reference formula params and set appropriate values
 * 5. Clears appliesToId/appliesToSubId for BAB/saves
 * 
 * Usage:
 *   cd apps/backend
 *   npx tsx scripts/migrate-bab-save-to-formulas.ts
 * 
 * Type checking:
 *   pnpm exec tsc --project tsconfig.json --noEmit
 */
async function migrateBABAndSavesToFormulas() {
    console.log('Starting migration of BAB and Saving Throw entities to formula-based approach...\n');

    try {
        // Find all BAB entities with ProgressionType in appliesToId
        // Only migrate EntityType.Other (class mechanics progression), not EntityType.Bonus (bonus entities)
        const babEntities = await prisma.featureEntity.findMany({
            where: {
                appliesTo: EntityAppliesToType.BaseAttackBonus,
                type: EntityType.Base, // Only class mechanics progression entities
                appliesToId: {
                    not: null,
                },
                // Only migrate entities that don't already have formula params
                formulaParamsId: null,
            },
        });

        console.log(`Found ${babEntities.length} BAB entities to migrate`);

        let babMigrated = 0;
        for (const entity of babEntities) {
            const progressionType = entity.appliesToId as ProgressionType;

            if (progressionType === null || progressionType === undefined) {
                console.warn(`Skipping entity ${entity.id}: invalid appliesToId`);
                continue;
            }

            // Generate formula params based on progression type
            let formulaParamsData: Parameters<typeof prisma.featureFormulaParams.create>[0]['data'];
            let entityValue: number | null = null;

            if (progressionType === ProgressionType.good) {
                // Good BAB: LINEAR_SCALING with scalingValue=1
                formulaParamsData = {
                    formulaId: FormulaId.LINEAR_SCALING,
                    interval: null,
                    formulaStartLevel: null,
                    abilityId: null,
                    thresholds: null,
                    values: null,
                    valuesRepresent: null,
                    cumulative: false,
                    includeProgressionLevel: true,
                    divisor: null,
                    baseValue: null,
                };
                entityValue = 1;
            } else if (progressionType === ProgressionType.average) {
                // Average BAB: LEVEL_TIMES_VALUE with scalingValue=0.75
                formulaParamsData = {
                    formulaId: FormulaId.LEVEL_TIMES_VALUE,
                    interval: null,
                    formulaStartLevel: null,
                    abilityId: null,
                    thresholds: null,
                    values: null,
                    valuesRepresent: null,
                    cumulative: false,
                    includeProgressionLevel: true,
                    divisor: null,
                    baseValue: null,
                };
                entityValue = 0.75;
            } else if (progressionType === ProgressionType.poor) {
                // Poor BAB: LEVEL_TIMES_VALUE with scalingValue=0.5
                formulaParamsData = {
                    formulaId: FormulaId.LEVEL_TIMES_VALUE,
                    interval: null,
                    formulaStartLevel: null,
                    abilityId: null,
                    thresholds: null,
                    values: null,
                    valuesRepresent: null,
                    cumulative: false,
                    includeProgressionLevel: true,
                    divisor: null,
                    baseValue: null,
                };
                entityValue = 0.5;
            } else {
                console.warn(`Skipping entity ${entity.id}: unknown progression type ${progressionType}`);
                continue;
            }

            // Create FeatureFormulaParams record
            const formulaParams = await prisma.featureFormulaParams.create({
                data: formulaParamsData,
            });

            // Update entity to reference formula params and set value
            await prisma.featureEntity.update({
                where: { id: entity.id },
                data: {
                    formulaParamsId: formulaParams.id,
                    value: entityValue,
                    appliesToId: null, // Clear ProgressionType enum value
                },
            });

            babMigrated++;
            const progressionTypeName = progressionType === ProgressionType.good ? 'good' :
                progressionType === ProgressionType.average ? 'average' : 'poor';
            console.log(`  Migrated BAB entity ${entity.id} (progression type: ${progressionTypeName})`);
        }

        console.log(`\nMigrated ${babMigrated} BAB entities\n`);

        // Find all Saving Throw entities with ProgressionType in appliesToSubId
        // Only migrate EntityType.Other (class mechanics progression), not EntityType.Bonus (bonus entities)
        const saveEntities = await prisma.featureEntity.findMany({
            where: {
                appliesTo: EntityAppliesToType.SavingThrow,
                type: EntityType.Base, // Only class mechanics progression entities
                appliesToSubId: {
                    not: null,
                },
                // Only migrate entities that don't already have formula params
                formulaParamsId: null,
            },
        });

        console.log(`Found ${saveEntities.length} Saving Throw entities to migrate`);

        let savesMigrated = 0;
        for (const entity of saveEntities) {
            const progressionType = entity.appliesToSubId as ProgressionType;
            const saveType = entity.appliesToId; // Fortitude, Reflex, or Will

            if (progressionType === null || progressionType === undefined) {
                console.warn(`Skipping entity ${entity.id}: invalid appliesToSubId`);
                continue;
            }

            if (saveType === null || saveType === undefined) {
                console.warn(`Skipping entity ${entity.id}: invalid appliesToId (save type)`);
                continue;
            }

            // Generate formula params based on progression type
            let formulaParamsData: Parameters<typeof prisma.featureFormulaParams.create>[0]['data'];

            if (progressionType === ProgressionType.good) {
                // Good Save: LEVEL_DIVIDED_BY_PLUS_BASE with divisor=2, baseValue=2
                formulaParamsData = {
                    formulaId: FormulaId.LEVEL_DIVIDED_BY_PLUS_BASE,
                    divisor: 2,
                    baseValue: 2,
                    interval: null,
                    formulaStartLevel: null,
                    abilityId: null,
                    thresholds: null,
                    values: null,
                    valuesRepresent: null,
                    cumulative: false,
                    includeProgressionLevel: true,
                };
            } else if (progressionType === ProgressionType.poor) {
                // Poor Save: LEVEL_DIVIDED_BY with divisor=3
                formulaParamsData = {
                    formulaId: FormulaId.LEVEL_DIVIDED_BY,
                    divisor: 3,
                    baseValue: null,
                    interval: null,
                    formulaStartLevel: null,
                    abilityId: null,
                    thresholds: null,
                    values: null,
                    valuesRepresent: null,
                    cumulative: false,
                    includeProgressionLevel: true,
                };
            } else {
                // Invalid progression type - should not happen for EntityType.Other entities
                // This indicates data corruption or entities that shouldn't be in class mechanics
                console.warn(`Skipping entity ${entity.id}: invalid progression type ${progressionType} for saving throw progression. Valid values are: good=0, poor=2`);
                continue;
            }

            // Create FeatureFormulaParams record
            const formulaParams = await prisma.featureFormulaParams.create({
                data: formulaParamsData,
            });

            // Update entity to reference formula params
            // Note: appliesToId stays (it's the save type), but appliesToSubId is cleared
            await prisma.featureEntity.update({
                where: { id: entity.id },
                data: {
                    formulaParamsId: formulaParams.id,
                    value: null, // Saves don't use entity.value
                    appliesToSubId: null, // Clear ProgressionType enum value
                },
            });

            savesMigrated++;
            const saveTypeName = saveType === SavingThrowId.Fortitude ? 'Fortitude' :
                saveType === SavingThrowId.Reflex ? 'Reflex' : 'Will';
            const progressionTypeName = progressionType === ProgressionType.good ? 'good' : 'poor';
            console.log(`  Migrated ${saveTypeName} Save entity ${entity.id} (progression type: ${progressionTypeName})`);
        }

        console.log(`\nMigrated ${savesMigrated} Saving Throw entities\n`);

        const totalSkipped = saveEntities.length - savesMigrated;
        console.log(`\nMigration complete!`);
        console.log(`  - BAB entities migrated: ${babMigrated}`);
        console.log(`  - Save entities migrated: ${savesMigrated}`);
        console.log(`  - Save entities skipped: ${totalSkipped} (invalid progression types)`);
        console.log(`  - Total entities migrated: ${babMigrated + savesMigrated}`);

        if (totalSkipped > 0) {
            console.log(`\n⚠️  Warning: ${totalSkipped} saving throw entities were skipped due to invalid progression types.`);
            console.log(`   These entities may need manual review and correction.`);
        }

    } catch (error) {
        console.error('Error during migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateBABAndSavesToFormulas()
    .then(() => {
        console.log('\nMigration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nMigration failed:', error);
        process.exit(1);
    });
