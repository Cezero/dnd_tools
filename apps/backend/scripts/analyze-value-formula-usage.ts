import { PrismaClient } from '@shared/prisma-client';
import { EntityType, EntityAppliesToType, ENTITY_TYPES, ENTITY_APPLIES_TO_TYPES, ConditionalScalingValueType } from '@shared/static-data';

const prisma = new PrismaClient();

/**
 * Script to analyze value and formula usage across different EntityType/EntityAppliesToType combinations
 * 
 * This script queries the database to determine:
 * 1. Which EntityType/EntityAppliesToType combinations have value set (non-null, non-zero)
 * 2. Which combinations have formulas
 * 3. Which formulas use valuesRepresent = AppliesToId (exception case)
 * 4. Distribution of value/formula usage patterns
 * 
 * Usage:
 *   cd apps/backend
 *   npx tsx scripts/analyze-value-formula-usage.ts
 */
async function analyzeValueFormulaUsage() {
    console.log('Analyzing value and formula usage across EntityType/EntityAppliesToType combinations...\n');

    try {
        // Get all entities with their formula params
        const allEntities = await prisma.featureEntity.findMany({
            select: {
                id: true,
                type: true,
                appliesTo: true,
                value: true,
                formulaParamsId: true,
                formulaParams: {
                    select: {
                        id: true,
                        formulaId: true,
                        valuesRepresent: true,
                    },
                },
            },
        });

        console.log(`Total entities: ${allEntities.length}\n`);

        // Group by EntityType and EntityAppliesToType
        type CombinationKey = string;
        const byCombination: Record<CombinationKey, {
            total: number;
            withValue: number; // value !== null && value !== 0
            withFormula: number;
            withFormulaAppliesToId: number; // formula with valuesRepresent = AppliesToId
            examples: Array<{
                id: number;
                value: number | null;
                hasFormula: boolean;
                formulaId: number | null;
                valuesRepresent: number | null;
            }>;
        }> = {};

        for (const entity of allEntities) {
            const typeName = ENTITY_TYPES[entity.type]?.name || `Type${entity.type}`;
            const appliesToName = ENTITY_APPLIES_TO_TYPES[entity.appliesTo]?.name || `AppliesTo${entity.appliesTo}`;
            const key = `${typeName} + ${appliesToName}`;

            if (!byCombination[key]) {
                byCombination[key] = {
                    total: 0,
                    withValue: 0,
                    withFormula: 0,
                    withFormulaAppliesToId: 0,
                    examples: [],
                };
            }

            byCombination[key].total++;

            const hasValue = entity.value !== null && entity.value !== 0;
            const hasFormula = entity.formulaParams !== null;
            const formulaId = entity.formulaParams?.formulaId ?? null;
            const valuesRepresent = entity.formulaParams?.valuesRepresent ?? null;
            const usesAppliesToId = valuesRepresent === ConditionalScalingValueType.AppliesToId;

            if (hasValue) {
                byCombination[key].withValue++;
            }

            if (hasFormula) {
                byCombination[key].withFormula++;
                if (usesAppliesToId) {
                    byCombination[key].withFormulaAppliesToId++;
                }
            }

            // Collect examples (up to 3 per combination)
            if (byCombination[key].examples.length < 3) {
                byCombination[key].examples.push({
                    id: entity.id,
                    value: entity.value,
                    hasFormula,
                    formulaId,
                    valuesRepresent,
                });
            }
        }

        // Print results grouped by EntityType
        console.log('Results by EntityType + EntityAppliesToType combination:\n');
        console.log('Type | AppliesTo | Total | With Value | With Formula | Formula+AppliesToId | % Value | % Formula');
        console.log('-----|-----------|-------|------------|-------------|---------------------|---------|----------');

        // Sort by EntityType, then by total count
        const sortedKeys = Object.keys(byCombination).sort((a, b) => {
            const aTotal = byCombination[a].total;
            const bTotal = byCombination[b].total;
            if (bTotal !== aTotal) return bTotal - aTotal;
            return a.localeCompare(b);
        });

        for (const key of sortedKeys) {
            const stats = byCombination[key];
            const valuePct = stats.total > 0 ? ((stats.withValue / stats.total) * 100).toFixed(1) : '0.0';
            const formulaPct = stats.total > 0 ? ((stats.withFormula / stats.total) * 100).toFixed(1) : '0.0';

            const [typeName, appliesToName] = key.split(' + ');
            const typeDisplay = typeName.padEnd(12);
            const appliesToDisplay = appliesToName.padEnd(20);

            console.log(
                `${typeDisplay} | ${appliesToDisplay} | ${String(stats.total).padStart(5)} | ${String(stats.withValue).padStart(10)} | ${String(stats.withFormula).padStart(11)} | ${String(stats.withFormulaAppliesToId).padStart(19)} | ${valuePct.padStart(6)}% | ${formulaPct.padStart(8)}%`
            );
        }

        // Summary by EntityType
        console.log('\n--- Summary by EntityType ---\n');
        const byType: Record<number, { total: number; withValue: number; withFormula: number; withFormulaAppliesToId: number }> = {};

        for (const entity of allEntities) {
            if (!byType[entity.type]) {
                byType[entity.type] = { total: 0, withValue: 0, withFormula: 0, withFormulaAppliesToId: 0 };
            }

            byType[entity.type].total++;
            if (entity.value !== null && entity.value !== 0) {
                byType[entity.type].withValue++;
            }
            if (entity.formulaParams) {
                byType[entity.type].withFormula++;
                if (entity.formulaParams.valuesRepresent === ConditionalScalingValueType.AppliesToId) {
                    byType[entity.type].withFormulaAppliesToId++;
                }
            }
        }

        for (const [typeIdStr, stats] of Object.entries(byType)) {
            const typeId = parseInt(typeIdStr, 10);
            const typeName = ENTITY_TYPES[typeId]?.name || 'Unknown';
            const valuePct = ((stats.withValue / stats.total) * 100).toFixed(1);
            const formulaPct = ((stats.withFormula / stats.total) * 100).toFixed(1);

            console.log(`${typeName} (${typeId}):`);
            console.log(`  Total: ${stats.total}`);
            console.log(`  With Value: ${stats.withValue} (${valuePct}%)`);
            console.log(`  With Formula: ${stats.withFormula} (${formulaPct}%)`);
            console.log(`  Formula with AppliesToId: ${stats.withFormulaAppliesToId}`);
            console.log('');
        }

        // Find combinations that should NOT have value/formula
        console.log('--- Combinations that likely should NOT have value/formula ---\n');
        const noValueCombinations: Array<{ key: string; total: number; withValue: number; withFormula: number }> = [];

        for (const [key, stats] of Object.entries(byCombination)) {
            if (stats.total >= 3 && stats.withValue === 0 && stats.withFormula === 0) {
                noValueCombinations.push({ key, total: stats.total, withValue: stats.withValue, withFormula: stats.withFormula });
            }
        }

        noValueCombinations.sort((a, b) => b.total - a.total);

        if (noValueCombinations.length > 0) {
            console.log('These combinations have 3+ entities but never use value or formula:');
            for (const combo of noValueCombinations.slice(0, 20)) {
                console.log(`  ${combo.key}: ${combo.total} entities (0 with value, 0 with formula)`);
            }
            if (noValueCombinations.length > 20) {
                console.log(`  ... and ${noValueCombinations.length - 20} more`);
            }
        } else {
            console.log('All combinations with 3+ entities use value or formula at least sometimes.');
        }

        // Find formulas that use AppliesToId
        console.log('\n--- Formulas using AppliesToId (exception case) ---\n');
        const appliesToIdFormulas = allEntities.filter(
            e => e.formulaParams?.valuesRepresent === ConditionalScalingValueType.AppliesToId
        );

        if (appliesToIdFormulas.length > 0) {
            console.log(`Found ${appliesToIdFormulas.length} entities with formulas using AppliesToId:\n`);
            const byTypeAppliesTo: Record<string, number> = {};
            for (const entity of appliesToIdFormulas) {
                const typeName = ENTITY_TYPES[entity.type]?.name || `Type${entity.type}`;
                const appliesToName = ENTITY_APPLIES_TO_TYPES[entity.appliesTo]?.name || `AppliesTo${entity.appliesTo}`;
                const key = `${typeName} + ${appliesToName}`;
                byTypeAppliesTo[key] = (byTypeAppliesTo[key] || 0) + 1;
            }

            for (const [key, count] of Object.entries(byTypeAppliesTo).sort((a, b) => b[1] - a[1])) {
                console.log(`  ${key}: ${count} entities`);
            }
        } else {
            console.log('No entities found with formulas using AppliesToId.');
        }

    } catch (error) {
        console.error('Error analyzing value/formula usage:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

analyzeValueFormulaUsage()
    .then(() => {
        console.log('\nAnalysis complete.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Analysis failed:', error);
        process.exit(1);
    });
