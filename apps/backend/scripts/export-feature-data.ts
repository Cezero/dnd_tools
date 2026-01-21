import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();

/**
 * Export all feature-related data to CSV files for migration
 * 
 * This script exports ALL feature-related tables to CSV files in dependency order.
 * The export is the ONLY source of data recovery when Prisma drops all feature tables.
 * 
 * Usage:
 *   cd apps/backend
 *   tsx scripts/export-feature-data.ts
 */

interface ExportManifest {
    exportTimestamp: string;
    databaseUrl: string;
    tables: Array<{
        tableName: string;
        csvFile: string;
        rowCount: number;
        checksum: string;
    }>;
}

/**
 * Escape CSV field - handles commas, quotes, and newlines
 */
function escapeCsvField(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    
    const str = String(value);
    
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
}

/**
 * Write array of objects to CSV file
 */
async function writeCsvFile(
    filePath: string,
    data: Array<Record<string, unknown>>,
    columns: string[]
): Promise<{ rowCount: number; checksum: string }> {
    const lines: string[] = [];
    
    // Write header
    lines.push(columns.map(escapeCsvField).join(','));
    
    // Write data rows
    for (const row of data) {
        const values = columns.map(col => escapeCsvField(row[col]));
        lines.push(values.join(','));
    }
    
    const content = lines.join('\n');
    const checksum = createHash('sha256').update(content, 'utf8').digest('hex');
    
    await writeFile(filePath, content, 'utf-8');
    
    return {
        rowCount: data.length,
        checksum,
    };
}

/**
 * Main export function
 */
async function exportFeatureData() {
    console.log('Starting feature data export...\n');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const exportDir = join(process.cwd(), 'data', 'exports', `feature-migration-${timestamp}`);
    
    try {
        // Create export directory
        await mkdir(exportDir, { recursive: true });
        console.log(`Export directory: ${exportDir}\n`);
        
        const manifest: ExportManifest = {
            exportTimestamp: new Date().toISOString(),
            databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'unknown',
            tables: [],
        };
        
        // 1. Export Feature table
        console.log('Exporting Feature table...');
        const features = await prisma.feature.findMany({
            orderBy: { id: 'asc' },
        });
        const featureResult = await writeCsvFile(
            join(exportDir, 'feature_export.csv'),
            features,
            ['id', 'slug', 'name', 'description', 'summary', 'displayInCharacterSheet']
        );
        manifest.tables.push({
            tableName: 'Feature',
            csvFile: 'feature_export.csv',
            rowCount: featureResult.rowCount,
            checksum: featureResult.checksum,
        });
        console.log(`  Exported ${featureResult.rowCount} rows`);
        
        // 2. Export FeatureProgression table
        console.log('Exporting FeatureProgression table...');
        const progressions = await prisma.featureProgression.findMany({
            orderBy: { id: 'asc' },
        });
        const progressionResult = await writeCsvFile(
            join(exportDir, 'feature_progression_export.csv'),
            progressions,
            ['id', 'sourceType', 'level', 'featureId', 'domainId', 'featId', 'companionId', 'editionId']
        );
        manifest.tables.push({
            tableName: 'FeatureProgression',
            csvFile: 'feature_progression_export.csv',
            rowCount: progressionResult.rowCount,
            checksum: progressionResult.checksum,
        });
        console.log(`  Exported ${progressionResult.rowCount} rows`);
        
        // 3. Export FeatureFormulaParams (no dependencies)
        console.log('Exporting FeatureFormulaParams table...');
        const formulaParams = await prisma.featureFormulaParams.findMany({
            orderBy: { id: 'asc' },
        });
        const formulaParamsResult = await writeCsvFile(
            join(exportDir, 'feature_formula_params_export.csv'),
            formulaParams,
            [
                'id', 'formulaId', 'interval', 'formulaStartLevel', 'abilityId',
                'thresholds', 'values', 'includeProgressionLevel', 'valuesRepresent',
                'cumulative', 'divisor', 'baseValue'
            ]
        );
        manifest.tables.push({
            tableName: 'FeatureFormulaParams',
            csvFile: 'feature_formula_params_export.csv',
            rowCount: formulaParamsResult.rowCount,
            checksum: formulaParamsResult.checksum,
        });
        console.log(`  Exported ${formulaParamsResult.rowCount} rows`);
        
        // 4. Export FeaturePrerequisite
        console.log('Exporting FeaturePrerequisite table...');
        const prerequisites = await prisma.featurePrerequisite.findMany({
            orderBy: { id: 'asc' },
        });
        const prerequisiteResult = await writeCsvFile(
            join(exportDir, 'feature_prerequisite_export.csv'),
            prerequisites,
            ['id', 'featureId', 'type', 'appliesToId', 'minValue']
        );
        manifest.tables.push({
            tableName: 'FeaturePrerequisite',
            csvFile: 'feature_prerequisite_export.csv',
            rowCount: prerequisiteResult.rowCount,
            checksum: prerequisiteResult.checksum,
        });
        console.log(`  Exported ${prerequisiteResult.rowCount} rows`);
        
        // 5. Export FeatureProgressionCondition
        console.log('Exporting FeatureProgressionCondition table...');
        const progressionConditions = await prisma.featureProgressionCondition.findMany({
            orderBy: { id: 'asc' },
        });
        const progressionConditionResult = await writeCsvFile(
            join(exportDir, 'feature_progression_condition_export.csv'),
            progressionConditions,
            ['id', 'progressionId', 'conditionType', 'conditionValue']
        );
        manifest.tables.push({
            tableName: 'FeatureProgressionCondition',
            csvFile: 'feature_progression_condition_export.csv',
            rowCount: progressionConditionResult.rowCount,
            checksum: progressionConditionResult.checksum,
        });
        console.log(`  Exported ${progressionConditionResult.rowCount} rows`);
        
        // 6. Export FeatureProgressionClassMap
        console.log('Exporting FeatureProgressionClassMap table...');
        const classMaps = await prisma.featureProgressionClassMap.findMany({
            orderBy: [{ progressionId: 'asc' }, { classId: 'asc' }],
        });
        const classMapResult = await writeCsvFile(
            join(exportDir, 'feature_progression_class_map_export.csv'),
            classMaps,
            ['progressionId', 'classId']
        );
        manifest.tables.push({
            tableName: 'FeatureProgressionClassMap',
            csvFile: 'feature_progression_class_map_export.csv',
            rowCount: classMapResult.rowCount,
            checksum: classMapResult.checksum,
        });
        console.log(`  Exported ${classMapResult.rowCount} rows`);
        
        // 7. Export FeatureProgressionRaceMap
        console.log('Exporting FeatureProgressionRaceMap table...');
        const raceMaps = await prisma.featureProgressionRaceMap.findMany({
            orderBy: [{ progressionId: 'asc' }, { raceId: 'asc' }],
        });
        const raceMapResult = await writeCsvFile(
            join(exportDir, 'feature_progression_race_map_export.csv'),
            raceMaps,
            ['progressionId', 'raceId']
        );
        manifest.tables.push({
            tableName: 'FeatureProgressionRaceMap',
            csvFile: 'feature_progression_race_map_export.csv',
            rowCount: raceMapResult.rowCount,
            checksum: raceMapResult.checksum,
        });
        console.log(`  Exported ${raceMapResult.rowCount} rows`);
        
        // 8. Export FeatureEntity
        console.log('Exporting FeatureEntity table...');
        const entities = await prisma.featureEntity.findMany({
            orderBy: { id: 'asc' },
        });
        const entityResult = await writeCsvFile(
            join(exportDir, 'feature_entity_export.csv'),
            entities,
            [
                'id', 'progressionId', 'appliesTo', 'appliesToId', 'appliesToSubId',
                'formulaParamsId', 'groupingId', 'type', 'value', 'bonusType',
                'displayInDetail', 'filterType'
            ]
        );
        manifest.tables.push({
            tableName: 'FeatureEntity',
            csvFile: 'feature_entity_export.csv',
            rowCount: entityResult.rowCount,
            checksum: entityResult.checksum,
        });
        console.log(`  Exported ${entityResult.rowCount} rows`);
        
        // 9. Export FeatureEntityCondition
        console.log('Exporting FeatureEntityCondition table...');
        const entityConditions = await prisma.featureEntityCondition.findMany({
            orderBy: { id: 'asc' },
        });
        const entityConditionResult = await writeCsvFile(
            join(exportDir, 'feature_entity_condition_export.csv'),
            entityConditions,
            ['id', 'featureEntityId', 'conditionType', 'conditionValue']
        );
        manifest.tables.push({
            tableName: 'FeatureEntityCondition',
            csvFile: 'feature_entity_condition_export.csv',
            rowCount: entityConditionResult.rowCount,
            checksum: entityConditionResult.checksum,
        });
        console.log(`  Exported ${entityConditionResult.rowCount} rows`);
        
        // 10. Export SpellcastingLink
        console.log('Exporting SpellcastingLink table...');
        const spellcastingLinks = await prisma.spellcastingLink.findMany({
            orderBy: { id: 'asc' },
        });
        const spellcastingLinkResult = await writeCsvFile(
            join(exportDir, 'spellcasting_link_export.csv'),
            spellcastingLinks,
            ['id', 'featureProgressionId', 'progressionId', 'inheritedFrom', 'levelOffset']
        );
        manifest.tables.push({
            tableName: 'SpellcastingLink',
            csvFile: 'spellcasting_link_export.csv',
            rowCount: spellcastingLinkResult.rowCount,
            checksum: spellcastingLinkResult.checksum,
        });
        console.log(`  Exported ${spellcastingLinkResult.rowCount} rows`);
        
        // 11. Export CharacterFeatureChoice
        console.log('Exporting CharacterFeatureChoice table...');
        const choices = await prisma.characterFeatureChoice.findMany({
            orderBy: { id: 'asc' },
        });
        const choiceResult = await writeCsvFile(
            join(exportDir, 'character_feature_choice_export.csv'),
            choices,
            [
                'id', 'characterId', 'progressionId', 'advancementId', 'featureEntityId',
                'appliesToId', 'appliesToSubId', 'choiceIndex', 'choiceGroupId',
                'choiceData', 'linkedChoiceGroupId'
            ]
        );
        manifest.tables.push({
            tableName: 'CharacterFeatureChoice',
            csvFile: 'character_feature_choice_export.csv',
            rowCount: choiceResult.rowCount,
            checksum: choiceResult.checksum,
        });
        console.log(`  Exported ${choiceResult.rowCount} rows`);
        
        // 12. Export CharacterFeatureUses
        console.log('Exporting CharacterFeatureUses table...');
        const uses = await prisma.characterFeatureUses.findMany({
            orderBy: { id: 'asc' },
        });
        const usesResult = await writeCsvFile(
            join(exportDir, 'character_feature_uses_export.csv'),
            uses,
            ['id', 'characterId', 'progressionId', 'featureEntityId', 'currentUses', 'maxUses', 'frequency']
        );
        manifest.tables.push({
            tableName: 'CharacterFeatureUses',
            csvFile: 'character_feature_uses_export.csv',
            rowCount: usesResult.rowCount,
            checksum: usesResult.checksum,
        });
        console.log(`  Exported ${usesResult.rowCount} rows`);
        
        // 13. Export TransformationFormEligibility
        console.log('Exporting TransformationFormEligibility table...');
        const eligibilities = await prisma.transformationFormEligibility.findMany({
            orderBy: { id: 'asc' },
        });
        const eligibilityResult = await writeCsvFile(
            join(exportDir, 'transformation_form_eligibility_export.csv'),
            eligibilities,
            ['id', 'featureId', 'monsterId', 'minLevel', 'notes']
        );
        manifest.tables.push({
            tableName: 'TransformationFormEligibility',
            csvFile: 'transformation_form_eligibility_export.csv',
            rowCount: eligibilityResult.rowCount,
            checksum: eligibilityResult.checksum,
        });
        console.log(`  Exported ${eligibilityResult.rowCount} rows`);
        
        // Write manifest file
        const manifestPath = join(exportDir, 'export_manifest.json');
        await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
        console.log(`\nExport manifest written to: ${manifestPath}`);
        
        // Print summary
        console.log('\n=== Export Summary ===');
        console.log(`Export directory: ${exportDir}`);
        console.log(`Total tables exported: ${manifest.tables.length}`);
        const totalRows = manifest.tables.reduce((sum, table) => sum + table.rowCount, 0);
        console.log(`Total rows exported: ${totalRows}`);
        console.log('\nTable breakdown:');
        for (const table of manifest.tables) {
            console.log(`  ${table.tableName}: ${table.rowCount} rows (${table.csvFile})`);
        }
        
        console.log('\n✅ Export completed successfully!');
        console.log('\n⚠️  IMPORTANT: Verify all CSV files and the manifest before proceeding with schema changes.');
        
    } catch (error) {
        console.error('\n❌ Export failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run export
exportFeatureData()
    .then(() => {
        console.log('\nExport script finished.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nExport script failed:', error);
        process.exit(1);
    });
