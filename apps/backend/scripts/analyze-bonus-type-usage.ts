import { PrismaClient } from '@shared/prisma-client';
import { EntityType, ENTITY_TYPES } from '@shared/static-data';

const prisma = new PrismaClient();

/**
 * Script to analyze bonusType usage across different EntityType values
 * 
 * This script queries the database to determine:
 * 1. Which EntityType values have bonusType set (non-null)
 * 2. Whether any non-Bonus entities have bonusType set
 * 3. Distribution of bonusType usage by EntityType
 * 
 * Usage:
 *   cd apps/backend
 *   npx tsx scripts/analyze-bonus-type-usage.ts
 */
async function analyzeBonusTypeUsage() {
    console.log('Analyzing bonusType usage across EntityType values...\n');

    try {
        // Get all entities grouped by type
        const allEntities = await prisma.featureEntity.findMany({
            select: {
                id: true,
                type: true,
                bonusType: true,
            },
        });

        console.log(`Total entities: ${allEntities.length}\n`);

        // Group by EntityType
        const byType: Record<number, { total: number; withBonusType: number; withoutBonusType: number; examples: Array<{ id: number; bonusType: number | null }> }> = {};

        for (const entity of allEntities) {
            if (!byType[entity.type]) {
                byType[entity.type] = {
                    total: 0,
                    withBonusType: 0,
                    withoutBonusType: 0,
                    examples: [],
                };
            }

            byType[entity.type].total++;
            if (entity.bonusType !== null) {
                byType[entity.type].withBonusType++;
                if (byType[entity.type].examples.length < 5) {
                    byType[entity.type].examples.push({ id: entity.id, bonusType: entity.bonusType });
                }
            } else {
                byType[entity.type].withoutBonusType++;
            }
        }

        // Print results
        console.log('Results by EntityType:\n');
        console.log('Type ID | Type Name        | Total | With bonusType | Without bonusType | % With bonusType');
        console.log('--------|------------------|-------|----------------|-------------------|----------------');

        for (const [typeIdStr, stats] of Object.entries(byType)) {
            const typeId = parseInt(typeIdStr, 10);
            const typeName = ENTITY_TYPES[typeId]?.name || 'Unknown';
            const percentage = stats.total > 0 ? ((stats.withBonusType / stats.total) * 100).toFixed(1) : '0.0';

            console.log(
                `${String(typeId).padStart(7)} | ${typeName.padEnd(16)} | ${String(stats.total).padStart(5)} | ${String(stats.withBonusType).padStart(14)} | ${String(stats.withoutBonusType).padStart(17)} | ${percentage.padStart(15)}%`
            );
        }

        console.log('\n');

        // Check for non-Bonus entities with bonusType
        const nonBonusWithBonusType = allEntities.filter(
            e => e.type !== EntityType.Bonus && e.bonusType !== null
        );

        if (nonBonusWithBonusType.length > 0) {
            console.log(`\n⚠️  WARNING: Found ${nonBonusWithBonusType.length} non-Bonus entities with bonusType set:\n`);
            for (const entity of nonBonusWithBonusType.slice(0, 10)) {
                const typeName = ENTITY_TYPES[entity.type]?.name || 'Unknown';
                console.log(`  Entity ID ${entity.id}: type=${typeName} (${entity.type}), bonusType=${entity.bonusType}`);
            }
            if (nonBonusWithBonusType.length > 10) {
                console.log(`  ... and ${nonBonusWithBonusType.length - 10} more`);
            }
        } else {
            console.log('✓ No non-Bonus entities have bonusType set (as expected)');
        }

        // Summary recommendation
        console.log('\n--- Summary ---');
        const bonusTypeEntities = byType[EntityType.Bonus];
        if (bonusTypeEntities) {
            const bonusPercentage = (bonusTypeEntities.withBonusType / bonusTypeEntities.total * 100).toFixed(1);
            console.log(`Bonus entities: ${bonusTypeEntities.withBonusType}/${bonusTypeEntities.total} (${bonusPercentage}%) have bonusType set`);
        }

        const shouldShowBonusType = [EntityType.Bonus];
        console.log(`\nRecommendation: Only show bonusType field for EntityType.Bonus (${EntityType.Bonus})`);
        console.log(`Currently hidden for: Choice (${EntityType.Choice}), Allocation (${EntityType.Allocation})`);
        console.log(`Should also hide for: Quantity (${EntityType.Quantity}), Replacement (${EntityType.Replacement}), Other (${EntityType.Other}), Base (${EntityType.Base})`);

    } catch (error) {
        console.error('Error analyzing bonusType usage:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

analyzeBonusTypeUsage()
    .then(() => {
        console.log('\nAnalysis complete.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Analysis failed:', error);
        process.exit(1);
    });
