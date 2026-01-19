import { PrismaClient } from '@shared/prisma-client';
import { EntityAppliesToType, FormulaId, EntityType } from '@shared/static-data';

const prisma = new PrismaClient();

/**
 * Revert script to fix incorrectly migrated bonus entities
 * 
 * This script reverts specific bonus entities that were incorrectly modified by the migration.
 * It only reverts entities that match the exact migration pattern (formula params created by migration).
 * 
 * Known incorrectly migrated entities: 3681, 4716, 4884, 5879
 * 
 * It:
 * 1. Finds bonus entities with formulaParamsId that match the EXACT migration pattern
 * 2. Checks that appliesToSubId is null (migration cleared it)
 * 3. Infers the original appliesToId/appliesToSubId from the formula params
 * 4. Restores the original values and clears formulaParamsId
 * 5. Deletes the incorrectly created FeatureFormulaParams records
 * 
 * Usage:
 *   cd apps/backend
 *   npx tsx scripts/revert-bonus-entities-migration.ts
 */
async function revertBonusEntities() {
    console.log('Starting revert of incorrectly migrated bonus entities...\n');

    try {
        // Find BAB bonus entities that were incorrectly migrated
        // Only entities that match the exact migration pattern (formula params + cleared appliesToId)
        const babBonusEntities = await prisma.featureEntity.findMany({
            where: {
                appliesTo: EntityAppliesToType.BaseAttackBonus,
                type: EntityType.Bonus, // Only bonus entities (should not have been migrated)
                formulaParamsId: {
                    not: null,
                },
                appliesToId: null, // Migration cleared this
            },
            include: {
                formulaParams: true,
            },
        });

        console.log(`Found ${babBonusEntities.length} BAB bonus entities to check`);

        let babReverted = 0;
        for (const entity of babBonusEntities) {
            if (!entity.formulaParams) {
                console.warn(`Skipping entity ${entity.id}: formulaParams not found`);
                continue;
            }

            // Only revert if formula params match EXACT migration pattern
            // Check for exact match: formula params must match what migration created
            const matchesMigrationPattern =
                (entity.formulaParams.formulaId === FormulaId.LINEAR_SCALING && entity.value === 1) ||
                (entity.formulaParams.formulaId === FormulaId.LEVEL_TIMES_VALUE && entity.value === 0.75) ||
                (entity.formulaParams.formulaId === FormulaId.LEVEL_TIMES_VALUE && entity.value === 0.5);

            if (!matchesMigrationPattern) {
                console.log(`Skipping entity ${entity.id}: formula params don't match exact migration pattern`);
                continue;
            }

            // Infer original ProgressionType from formula params
            let originalProgressionType: number | null = null;

            if (entity.formulaParams.formulaId === FormulaId.LINEAR_SCALING && entity.value === 1) {
                originalProgressionType = 0; // ProgressionType.good
            } else if (entity.formulaParams.formulaId === FormulaId.LEVEL_TIMES_VALUE && entity.value === 0.75) {
                originalProgressionType = 1; // ProgressionType.average
            } else if (entity.formulaParams.formulaId === FormulaId.LEVEL_TIMES_VALUE && entity.value === 0.5) {
                originalProgressionType = 2; // ProgressionType.poor
            }

            // Restore original appliesToId and clear formulaParamsId
            await prisma.featureEntity.update({
                where: { id: entity.id },
                data: {
                    appliesToId: originalProgressionType,
                    formulaParamsId: null,
                    value: null, // Clear the scalingValue that was set
                },
            });

            // Delete the incorrectly created FeatureFormulaParams
            await prisma.featureFormulaParams.delete({
                where: { id: entity.formulaParamsId! },
            });

            babReverted++;
            console.log(`  Reverted BAB bonus entity ${entity.id} (restored progression type: ${originalProgressionType})`);
        }

        console.log(`\nReverted ${babReverted} BAB bonus entities\n`);

        // Find Saving Throw bonus entities that were incorrectly migrated
        // Only entities that match the exact migration pattern (formula params + cleared appliesToSubId)
        const saveBonusEntities = await prisma.featureEntity.findMany({
            where: {
                appliesTo: EntityAppliesToType.SavingThrow,
                type: EntityType.Bonus, // Only bonus entities (should not have been migrated)
                formulaParamsId: {
                    not: null,
                },
                appliesToSubId: null, // Migration cleared this
            },
            include: {
                formulaParams: true,
            },
        });

        console.log(`Found ${saveBonusEntities.length} Saving Throw bonus entities to check`);

        let savesReverted = 0;
        for (const entity of saveBonusEntities) {
            if (!entity.formulaParams) {
                console.warn(`Skipping entity ${entity.id}: formulaParams not found`);
                continue;
            }

            // Only revert if formula params match EXACT migration pattern
            // Check for exact match: formula params must match what migration created
            const matchesGoodSavePattern =
                entity.formulaParams.formulaId === FormulaId.LEVEL_DIVIDED_BY_PLUS_BASE &&
                entity.formulaParams.divisor === 2 &&
                entity.formulaParams.baseValue === 2 &&
                entity.formulaParams.interval === null &&
                entity.formulaParams.formulaStartLevel === null &&
                entity.formulaParams.abilityId === null &&
                entity.formulaParams.includeProgressionLevel === true;

            const matchesPoorSavePattern =
                entity.formulaParams.formulaId === FormulaId.LEVEL_DIVIDED_BY &&
                entity.formulaParams.divisor === 3 &&
                entity.formulaParams.baseValue === null &&
                entity.formulaParams.interval === null &&
                entity.formulaParams.formulaStartLevel === null &&
                entity.formulaParams.abilityId === null &&
                entity.formulaParams.includeProgressionLevel === true;

            if (!matchesGoodSavePattern && !matchesPoorSavePattern) {
                console.log(`Skipping entity ${entity.id}: formula params don't match exact migration pattern`);
                continue;
            }

            // Infer original ProgressionType from formula params
            let originalProgressionType: number | null = null;

            if (matchesGoodSavePattern) {
                originalProgressionType = 0; // ProgressionType.good
            } else if (matchesPoorSavePattern) {
                originalProgressionType = 2; // ProgressionType.poor
            }

            // Restore original appliesToSubId and clear formulaParamsId
            await prisma.featureEntity.update({
                where: { id: entity.id },
                data: {
                    appliesToSubId: originalProgressionType,
                    formulaParamsId: null,
                },
            });

            // Delete the incorrectly created FeatureFormulaParams
            await prisma.featureFormulaParams.delete({
                where: { id: entity.formulaParamsId! },
            });

            savesReverted++;
            const saveTypeName = entity.appliesToId === 0 ? 'Fortitude' :
                entity.appliesToId === 1 ? 'Reflex' : 'Will';
            console.log(`  Reverted ${saveTypeName} Save bonus entity ${entity.id} (restored progression type: ${originalProgressionType})`);
        }

        console.log(`\nReverted ${savesReverted} Saving Throw bonus entities\n`);

        console.log(`\nRevert complete!`);
        console.log(`  - BAB bonus entities reverted: ${babReverted}`);
        console.log(`  - Save bonus entities reverted: ${savesReverted}`);
        console.log(`  - Total entities reverted: ${babReverted + savesReverted}`);

    } catch (error) {
        console.error('Error during revert:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run revert
revertBonusEntities()
    .then(() => {
        console.log('\nRevert completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nRevert failed:', error);
        process.exit(1);
    });
