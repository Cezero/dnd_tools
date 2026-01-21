import { readFile } from 'fs/promises';
import { join } from 'path';

import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();

/**
 * Restore wizard class features (classId 27) from backup export
 * 
 * This script restores only wizard features from the backup export and:
 * 1. Merges Feature and FeatureProgression into new Feature table
 * 2. Duplicates FeaturePrerequisite and TransformationFormEligibility for each progression
 * 3. Updates all foreign key references (progressionId -> featureId)
 * 
 * Usage:
 *   cd apps/backend
 *   tsx scripts/restore-wizard-features.ts
 * 
 * The script uses the backup export at: data/exports/feature-migration-2026-01-19T23-51-56
 */

const WIZARD_CLASS_ID = 27;
const BACKUP_EXPORT_DIR = 'data/exports/feature-migration-2026-01-19T23-51-56';

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
 * Parse CSV file and return array of objects
 */
async function parseCsvFile(filePath: string): Promise<Array<Record<string, string>>> {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
        return [];
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

    // Parse data rows
    const records: Array<Record<string, string>> = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                if (inQuotes && line[j + 1] === '"') {
                    current += '"';
                    j++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim()); // Last value

        const record: Record<string, string> = {};
        for (let j = 0; j < header.length; j++) {
            record[header[j]] = values[j] || '';
        }
        records.push(record);
    }

    return records;
}

/**
 * Main restore function
 */
async function restoreWizardFeatures(exportDir: string) {
    console.log(`Starting wizard feature restore from: ${exportDir}\n`);

    const BATCH_SIZE = 100; // Process records in batches to avoid transaction timeouts

    try {
        // Read manifest
        const manifestPath = join(exportDir, 'export_manifest.json');
        const manifestContent = await readFile(manifestPath, 'utf-8');
        const manifest: ExportManifest = JSON.parse(manifestContent);

        console.log('Export manifest loaded:');
        console.log(`  Export timestamp: ${manifest.exportTimestamp}`);
        console.log(`  Tables: ${manifest.tables.length}`);
        console.log(`  Total rows: ${manifest.tables.reduce((sum, t) => sum + t.rowCount, 0)}\n`);

        // Step 1: Read all CSV files
        console.log('Reading CSV files...');
        const features = await parseCsvFile(join(exportDir, 'feature_export.csv'));
        const progressions = await parseCsvFile(join(exportDir, 'feature_progression_export.csv'));
        const formulaParams = await parseCsvFile(join(exportDir, 'feature_formula_params_export.csv'));
        const prerequisites = await parseCsvFile(join(exportDir, 'feature_prerequisite_export.csv'));
        const progressionConditions = await parseCsvFile(join(exportDir, 'feature_progression_condition_export.csv'));
        const classMaps = await parseCsvFile(join(exportDir, 'feature_progression_class_map_export.csv'));
        const raceMaps = await parseCsvFile(join(exportDir, 'feature_progression_race_map_export.csv'));
        const entities = await parseCsvFile(join(exportDir, 'feature_entity_export.csv'));
        const entityConditions = await parseCsvFile(join(exportDir, 'feature_entity_condition_export.csv'));
        const spellcastingLinks = await parseCsvFile(join(exportDir, 'spellcasting_link_export.csv'));
        const choices = await parseCsvFile(join(exportDir, 'character_feature_choice_export.csv'));
        const uses = await parseCsvFile(join(exportDir, 'character_feature_uses_export.csv'));
        const eligibilities = await parseCsvFile(join(exportDir, 'transformation_form_eligibility_export.csv'));

        console.log('  All CSV files read successfully\n');

        // Step 2: Identify wizard features (classId 27)
        console.log(`Identifying wizard features (classId ${WIZARD_CLASS_ID})...`);
        const wizardProgressionIds = new Set<number>();
        for (const classMap of classMaps) {
            const classId = Number(classMap.classId);
            if (classId === WIZARD_CLASS_ID) {
                const progressionId = Number(classMap.progressionId);
                wizardProgressionIds.add(progressionId);
            }
        }
        console.log(`  Found ${wizardProgressionIds.size} wizard feature progressions\n`);

        if (wizardProgressionIds.size === 0) {
            console.error('  ERROR: No wizard features found in backup data!');
            return;
        }

        // Step 3: Filter progressions to only wizard features
        const wizardProgressions = progressions.filter(prog => {
            const progressionId = Number(prog.id);
            return wizardProgressionIds.has(progressionId);
        });
        console.log(`  Filtered to ${wizardProgressions.length} wizard progressions\n`);

        // Step 4: Create mapping from old Feature.id to FeatureProgression.id[] for wizard features only
        console.log('Creating feature to progression mapping for wizard features...');
        const featureToProgressions = new Map<number, number[]>();
        for (const prog of wizardProgressions) {
            const featureId = Number(prog.featureId);
            const progressionId = Number(prog.id);
            if (!featureToProgressions.has(featureId)) {
                featureToProgressions.set(featureId, []);
            }
            featureToProgressions.get(featureId)!.push(progressionId);
        }
        console.log(`  Mapped ${featureToProgressions.size} wizard features to progressions\n`);

        // Step 5: Filter related data to only wizard features
        console.log('Filtering related data to wizard features...');
        
        // Filter entities by wizard progressionIds
        const wizardEntities = entities.filter(entity => {
            const progressionId = Number(entity.progressionId);
            return wizardProgressionIds.has(progressionId);
        });
        console.log(`  Filtered to ${wizardEntities.length} wizard entities`);

        // Collect formulaParamsIds from wizard entities
        const wizardFormulaParamsIds = new Set<number>();
        for (const entity of wizardEntities) {
            if (entity.formulaParamsId) {
                wizardFormulaParamsIds.add(Number(entity.formulaParamsId));
            }
        }

        // Filter formulaParams to only those used by wizard entities
        const wizardFormulaParams = formulaParams.filter(param => {
            const paramId = Number(param.id);
            return wizardFormulaParamsIds.has(paramId);
        });
        console.log(`  Filtered to ${wizardFormulaParams.length} wizard formula params`);

        // Filter entity conditions by wizard entity IDs
        const wizardEntityIds = new Set(wizardEntities.map(e => Number(e.id)));
        const wizardEntityConditions = entityConditions.filter(condition => {
            const entityId = Number(condition.featureEntityId);
            return wizardEntityIds.has(entityId);
        });
        console.log(`  Filtered to ${wizardEntityConditions.length} wizard entity conditions`);

        // Filter progression conditions by wizard progressionIds
        const wizardProgressionConditions = progressionConditions.filter(condition => {
            const progressionId = Number(condition.progressionId);
            return wizardProgressionIds.has(progressionId);
        });
        console.log(`  Filtered to ${wizardProgressionConditions.length} wizard progression conditions`);

        // Filter prerequisites by featureIds that map to wizard progressions
        const wizardFeatureIds = new Set(featureToProgressions.keys());
        const wizardPrerequisites = prerequisites.filter(prereq => {
            const featureId = Number(prereq.featureId);
            return wizardFeatureIds.has(featureId);
        });
        console.log(`  Filtered to ${wizardPrerequisites.length} wizard prerequisites`);

        // Filter class maps to only wizard progressions
        const wizardClassMaps = classMaps.filter(map => {
            const progressionId = Number(map.progressionId);
            return wizardProgressionIds.has(progressionId);
        });
        console.log(`  Filtered to ${wizardClassMaps.length} wizard class maps`);

        // Filter race maps - check if any wizard progressions have race mappings
        const wizardRaceMaps = raceMaps.filter(map => {
            const progressionId = Number(map.progressionId);
            return wizardProgressionIds.has(progressionId);
        });
        console.log(`  Filtered to ${wizardRaceMaps.length} wizard race maps`);

        // Filter spellcasting links by wizard progressionIds
        const wizardSpellcastingLinks = spellcastingLinks.filter(link => {
            const progressionId = Number(link.featureProgressionId);
            return wizardProgressionIds.has(progressionId);
        });
        console.log(`  Filtered to ${wizardSpellcastingLinks.length} wizard spellcasting links`);

        // Filter character feature choices by wizard progressionIds
        const wizardChoices = choices.filter(choice => {
            const progressionId = Number(choice.progressionId);
            return wizardProgressionIds.has(progressionId);
        });
        console.log(`  Filtered to ${wizardChoices.length} wizard character feature choices`);

        // Filter character feature uses by wizard progressionIds
        const wizardUses = uses.filter(use => {
            const progressionId = Number(use.progressionId);
            return wizardProgressionIds.has(progressionId);
        });
        console.log(`  Filtered to ${wizardUses.length} wizard character feature uses`);

        // Filter transformation form eligibilities by featureIds that map to wizard progressions
        const wizardEligibilities = eligibilities.filter(elig => {
            const featureId = Number(elig.featureId);
            return wizardFeatureIds.has(featureId);
        });
        console.log(`  Filtered to ${wizardEligibilities.length} wizard transformation form eligibilities\n`);

        // Step 6: Import FeatureFormulaParams first (no dependencies)
        console.log('Importing FeatureFormulaParams...');
        for (let i = 0; i < wizardFormulaParams.length; i += BATCH_SIZE) {
            const batch = wizardFormulaParams.slice(i, i + BATCH_SIZE);
            await prisma.$transaction(async (tx) => {
                const data = batch.map(param => ({
                    id: Number(param.id),
                    formulaId: Number(param.formulaId),
                    interval: param.interval ? Number(param.interval) : null,
                    formulaStartLevel: param.formulaStartLevel ? Number(param.formulaStartLevel) : null,
                    abilityId: param.abilityId ? Number(param.abilityId) : null,
                    thresholds: param.thresholds || null,
                    values: param.values || null,
                    includeProgressionLevel: param.includeProgressionLevel === 'true' || param.includeProgressionLevel === '1',
                    featureLevelZero: param.featureLevelZero === 'true' || param.featureLevelZero === '1' || false,
                    valuesRepresent: param.valuesRepresent ? Number(param.valuesRepresent) : null,
                    cumulative: param.cumulative === 'true' || param.cumulative === '1',
                    divisor: param.divisor ? Number(param.divisor) : null,
                    baseValue: param.baseValue ? Number(param.baseValue) : null,
                    startingValue: param.startingValue ? Number(param.startingValue) : null,
                }));
                await tx.featureFormulaParams.createMany({
                    data,
                    skipDuplicates: true,
                });
            }, { timeout: 30000 });
        }
        console.log(`  Processed ${wizardFormulaParams.length} rows (duplicates skipped)\n`);

        // Step 7: Merge Feature and FeatureProgression into new Feature table
        console.log('Merging Feature and FeatureProgression into new Feature table...');
        let featureCount = 0;
        let slugConflicts = 0;
        const slugMap = new Map<string, number>();

        // Build all feature data first
        const featureData: Array<{
            id: number;
            slug: string;
            name: string;
            description: string;
            summary: string | null;
            displayInCharacterSheet: boolean;
            sourceType: number;
            level: number;
            domainId: number | null;
            featId: number | null;
            companionId: number | null;
            editionId: number | null;
        }> = [];

        for (const prog of wizardProgressions) {
            const featureId = Number(prog.featureId);
            const progressionId = Number(prog.id);

            // Find corresponding Feature
            const feature = features.find(f => Number(f.id) === featureId);
            if (!feature) {
                console.error(`  WARNING: No feature found for progression ${progressionId} (featureId: ${featureId})`);
                continue;
            }

            // Handle slug conflicts - append progression ID if slug already used
            let slug = feature.slug;
            if (slugMap.has(slug)) {
                slug = `${feature.slug}-${progressionId}`;
                slugConflicts++;
            }
            slugMap.set(slug, progressionId);

            featureData.push({
                id: progressionId, // Use old FeatureProgression.id as new Feature.id
                slug,
                name: feature.name,
                description: feature.description,
                summary: feature.summary || null,
                displayInCharacterSheet: feature.displayInCharacterSheet === 'true' || feature.displayInCharacterSheet === '1',
                sourceType: Number(prog.sourceType),
                level: Number(prog.level),
                domainId: prog.domainId ? Number(prog.domainId) : null,
                featId: prog.featId ? Number(prog.featId) : null,
                companionId: prog.companionId ? Number(prog.companionId) : null,
                editionId: prog.editionId ? Number(prog.editionId) : null,
            });
        }

        // Import in batches
        for (let i = 0; i < featureData.length; i += BATCH_SIZE) {
            const batch = featureData.slice(i, i + BATCH_SIZE);
            await prisma.$transaction(async (tx) => {
                await tx.feature.createMany({
                    data: batch,
                    skipDuplicates: true,
                });
            }, { timeout: 30000 });
            featureCount += batch.length;
            if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= featureData.length) {
                console.log(`  Processed ${Math.min(i + BATCH_SIZE, featureData.length)}/${featureData.length} features...`);
            }
        }
        console.log(`  Imported ${featureCount} features`);
        if (slugConflicts > 0) {
            console.log(`  WARNING: ${slugConflicts} slug conflicts resolved by appending progression ID\n`);
        } else {
            console.log();
        }

        // Step 8: Import FeaturePrerequisite (duplicate for each progression)
        console.log('Importing FeaturePrerequisite (duplicating for each progression)...');
        let prerequisiteCount = 0;

        // Build all prerequisite data first
        const prerequisiteData: Array<{
            featureId: number;
            type: number;
            appliesToId: number | null;
            minValue: number;
        }> = [];

        for (const prereq of wizardPrerequisites) {
            const oldFeatureId = Number(prereq.featureId);
            const progressionIds = featureToProgressions.get(oldFeatureId) || [];

            if (progressionIds.length === 0) {
                console.error(`  WARNING: No progressions found for feature ${oldFeatureId}, skipping prerequisite ${prereq.id}`);
                continue;
            }

            // Create duplicate prerequisite for each progression
            for (const progressionId of progressionIds) {
                prerequisiteData.push({
                    featureId: progressionId, // Use progression ID as new feature ID
                    type: Number(prereq.type),
                    appliesToId: prereq.appliesToId ? Number(prereq.appliesToId) : null,
                    minValue: Number(prereq.minValue),
                });
            }
        }

        // Import in batches
        for (let i = 0; i < prerequisiteData.length; i += BATCH_SIZE) {
            const batch = prerequisiteData.slice(i, i + BATCH_SIZE);
            await prisma.$transaction(async (tx) => {
                await tx.featurePrerequisite.createMany({
                    data: batch,
                    skipDuplicates: true,
                });
            }, { timeout: 30000 });
            prerequisiteCount += batch.length;
        }
        console.log(`  Processed ${prerequisiteCount} prerequisites (from ${wizardPrerequisites.length} original, duplicates skipped)\n`);

        // Step 9: Import TransformationFormEligibility (duplicate for each progression)
        console.log('Importing TransformationFormEligibility (duplicating for each progression)...');
        let eligibilityCount = 0;

        // Build all eligibility data first
        const eligibilityData: Array<{
            featureId: number;
            monsterId: number;
            minLevel: number | null;
            notes: string | null;
        }> = [];

        for (const elig of wizardEligibilities) {
            const oldFeatureId = Number(elig.featureId);
            const progressionIds = featureToProgressions.get(oldFeatureId) || [];

            if (progressionIds.length === 0) {
                console.error(`  WARNING: No progressions found for feature ${oldFeatureId}, skipping eligibility ${elig.id}`);
                continue;
            }

            // Create duplicate eligibility for each progression
            for (const progressionId of progressionIds) {
                eligibilityData.push({
                    featureId: progressionId, // Use progression ID as new feature ID
                    monsterId: Number(elig.monsterId),
                    minLevel: elig.minLevel ? Number(elig.minLevel) : null,
                    notes: elig.notes || null,
                });
            }
        }

        // Import in batches
        for (let i = 0; i < eligibilityData.length; i += BATCH_SIZE) {
            const batch = eligibilityData.slice(i, i + BATCH_SIZE);
            await prisma.$transaction(async (tx) => {
                await tx.transformationFormEligibility.createMany({
                    data: batch,
                    skipDuplicates: true,
                });
            }, { timeout: 30000 });
            eligibilityCount += batch.length;
        }
        console.log(`  Processed ${eligibilityCount} eligibilities (from ${wizardEligibilities.length} original, duplicates skipped)\n`);

        // Step 10: Import FeatureEntity (update progressionId -> featureId)
        console.log('Importing FeatureEntity (updating progressionId -> featureId)...');
        for (let i = 0; i < wizardEntities.length; i += BATCH_SIZE) {
            const batch = wizardEntities.slice(i, i + BATCH_SIZE);
            await prisma.$transaction(async (tx) => {
                const data = batch.map(entity => ({
                    id: Number(entity.id),
                    featureId: Number(entity.progressionId), // progressionId becomes featureId
                    appliesTo: Number(entity.appliesTo),
                    appliesToId: entity.appliesToId ? Number(entity.appliesToId) : null,
                    appliesToSubId: entity.appliesToSubId ? Number(entity.appliesToSubId) : null,
                    formulaParamsId: entity.formulaParamsId ? Number(entity.formulaParamsId) : null,
                    groupingId: Number(entity.groupingId),
                    type: Number(entity.type),
                    value: entity.value ? parseFloat(entity.value) : null,
                    bonusType: entity.bonusType ? Number(entity.bonusType) : null,
                    displayInDetail: entity.displayInDetail === 'true' || entity.displayInDetail === '1',
                    filterType: entity.filterType ? Number(entity.filterType) : null,
                }));
                await tx.featureEntity.createMany({
                    data,
                    skipDuplicates: true,
                });
            }, { timeout: 30000 });
            if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= wizardEntities.length) {
                console.log(`  Processed ${Math.min(i + BATCH_SIZE, wizardEntities.length)}/${wizardEntities.length} entities...`);
            }
        }
        console.log(`  Processed ${wizardEntities.length} entities (duplicates skipped)\n`);

        // Step 11: Import FeatureEntityCondition
        console.log('Importing FeatureEntityCondition...');
        for (let i = 0; i < wizardEntityConditions.length; i += BATCH_SIZE) {
            const batch = wizardEntityConditions.slice(i, i + BATCH_SIZE);
            await prisma.$transaction(async (tx) => {
                const data = batch.map(condition => ({
                    id: Number(condition.id),
                    featureEntityId: Number(condition.featureEntityId),
                    conditionType: Number(condition.conditionType),
                    conditionValue: Number(condition.conditionValue),
                }));
                await tx.featureEntityCondition.createMany({
                    data,
                    skipDuplicates: true,
                });
            }, { timeout: 30000 });
        }
        console.log(`  Processed ${wizardEntityConditions.length} entity conditions (duplicates skipped)\n`);

        // Step 12: Import FeatureCondition (formerly FeatureProgressionCondition)
        console.log('Importing FeatureCondition (updating progressionId -> featureId)...');
        for (let i = 0; i < wizardProgressionConditions.length; i += BATCH_SIZE) {
            const batch = wizardProgressionConditions.slice(i, i + BATCH_SIZE);
            await prisma.$transaction(async (tx) => {
                const data = batch.map(condition => ({
                    featureId: Number(condition.progressionId), // progressionId becomes featureId
                    conditionType: Number(condition.conditionType),
                    conditionValue: Number(condition.conditionValue),
                }));
                await tx.featureCondition.createMany({
                    data,
                    skipDuplicates: true,
                });
            }, { timeout: 30000 });
        }
        console.log(`  Processed ${wizardProgressionConditions.length} feature conditions (duplicates skipped)\n`);

        // Step 13: Import junction tables (update progressionId -> featureId)
        console.log('Importing FeatureClassMap (updating progressionId -> featureId)...');
        for (let i = 0; i < wizardClassMaps.length; i += BATCH_SIZE) {
            const batch = wizardClassMaps.slice(i, i + BATCH_SIZE);
            await prisma.$transaction(async (tx) => {
                const data = batch.map(map => ({
                    featureId: Number(map.progressionId), // progressionId becomes featureId
                    classId: Number(map.classId),
                }));
                await tx.featureClassMap.createMany({
                    data,
                    skipDuplicates: true,
                });
            }, { timeout: 30000 });
        }
        console.log(`  Processed ${wizardClassMaps.length} class mappings (duplicates skipped)\n`);

        if (wizardRaceMaps.length > 0) {
            console.log('Importing FeatureRaceMap (updating progressionId -> featureId)...');
            for (let i = 0; i < wizardRaceMaps.length; i += BATCH_SIZE) {
                const batch = wizardRaceMaps.slice(i, i + BATCH_SIZE);
                await prisma.$transaction(async (tx) => {
                    const data = batch.map(map => ({
                        featureId: Number(map.progressionId), // progressionId becomes featureId
                        raceId: Number(map.raceId),
                    }));
                    await tx.featureRaceMap.createMany({
                        data,
                        skipDuplicates: true,
                    });
                }, { timeout: 30000 });
            }
            console.log(`  Processed ${wizardRaceMaps.length} race mappings (duplicates skipped)\n`);
        }

        // Step 14: Import SpellcastingLink (update featureProgressionId -> featureId)
        console.log('Importing SpellcastingLink (updating featureProgressionId -> featureId)...');
        for (let i = 0; i < wizardSpellcastingLinks.length; i += BATCH_SIZE) {
            const batch = wizardSpellcastingLinks.slice(i, i + BATCH_SIZE);
            await prisma.$transaction(async (tx) => {
                const data = batch.map(link => ({
                    id: Number(link.id),
                    featureId: Number(link.featureProgressionId), // featureProgressionId becomes featureId
                    progressionId: Number(link.progressionId),
                    inheritedFrom: link.inheritedFrom || null,
                    levelOffset: link.levelOffset ? Number(link.levelOffset) : null,
                }));
                await tx.spellcastingLink.createMany({
                    data,
                    skipDuplicates: true,
                });
            }, { timeout: 30000 });
        }
        console.log(`  Processed ${wizardSpellcastingLinks.length} spellcasting links (duplicates skipped)\n`);

        // Step 15: Import CharacterFeatureChoice (update progressionId -> featureId)
        console.log('Importing CharacterFeatureChoice (updating progressionId -> featureId)...');
        for (let i = 0; i < wizardChoices.length; i += BATCH_SIZE) {
            const batch = wizardChoices.slice(i, i + BATCH_SIZE);
            await prisma.$transaction(async (tx) => {
                const data = batch.map(choice => ({
                    id: Number(choice.id),
                    characterId: Number(choice.characterId),
                    featureId: Number(choice.progressionId), // progressionId becomes featureId
                    advancementId: Number(choice.advancementId),
                    featureEntityId: Number(choice.featureEntityId),
                    appliesToId: Number(choice.appliesToId),
                    appliesToSubId: choice.appliesToSubId ? Number(choice.appliesToSubId) : null,
                    choiceIndex: choice.choiceIndex ? Number(choice.choiceIndex) : null,
                    choiceGroupId: choice.choiceGroupId || null,
                    choiceData: choice.choiceData ? JSON.parse(choice.choiceData) : null,
                    linkedChoiceGroupId: choice.linkedChoiceGroupId || null,
                }));
                await tx.characterFeatureChoice.createMany({
                    data,
                    skipDuplicates: true,
                });
            }, { timeout: 30000 });
        }
        console.log(`  Processed ${wizardChoices.length} character feature choices (duplicates skipped)\n`);

        // Step 16: Import CharacterFeatureUses (update progressionId -> featureId)
        console.log('Importing CharacterFeatureUses (updating progressionId -> featureId)...');
        for (let i = 0; i < wizardUses.length; i += BATCH_SIZE) {
            const batch = wizardUses.slice(i, i + BATCH_SIZE);
            await prisma.$transaction(async (tx) => {
                const data = batch.map(use => ({
                    id: Number(use.id),
                    characterId: Number(use.characterId),
                    featureId: Number(use.progressionId), // progressionId becomes featureId
                    featureEntityId: Number(use.featureEntityId),
                    currentUses: Number(use.currentUses),
                    maxUses: Number(use.maxUses),
                    frequency: Number(use.frequency),
                }));
                await tx.characterFeatureUses.createMany({
                    data,
                    skipDuplicates: true,
                });
            }, { timeout: 30000 });
        }
        console.log(`  Processed ${wizardUses.length} character feature uses (duplicates skipped)\n`);

        // Validation summary
        console.log('=== Restore Summary ===');
        console.log(`Wizard features processed: ${featureCount} (duplicates skipped if already exist)`);
        console.log(`FeatureFormulaParams processed: ${wizardFormulaParams.length} (duplicates skipped)`);
        console.log(`FeaturePrerequisites processed: ${prerequisiteCount} (from ${wizardPrerequisites.length} original, duplicates skipped)`);
        console.log(`TransformationFormEligibilities processed: ${eligibilityCount} (from ${wizardEligibilities.length} original, duplicates skipped)`);
        console.log(`FeatureEntities processed: ${wizardEntities.length} (duplicates skipped)`);
        console.log(`FeatureEntityConditions processed: ${wizardEntityConditions.length} (duplicates skipped)`);
        console.log(`FeatureConditions processed: ${wizardProgressionConditions.length} (duplicates skipped)`);
        console.log(`FeatureClassMaps processed: ${wizardClassMaps.length} (duplicates skipped)`);
        console.log(`FeatureRaceMaps processed: ${wizardRaceMaps.length} (duplicates skipped)`);
        console.log(`SpellcastingLinks processed: ${wizardSpellcastingLinks.length} (duplicates skipped)`);
        console.log(`CharacterFeatureChoices processed: ${wizardChoices.length} (duplicates skipped)`);
        console.log(`CharacterFeatureUses processed: ${wizardUses.length} (duplicates skipped)`);

        console.log('\n✅ Wizard feature restore completed successfully!');
        console.log('\n⚠️  IMPORTANT: Verify data integrity after restore.');
        console.log('   Note: The script uses skipDuplicates, so it is safe to re-run if it fails partway through.');

    } catch (error) {
        console.error('\n❌ Restore failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run restore with hardcoded backup directory
restoreWizardFeatures(BACKUP_EXPORT_DIR)
    .then(() => {
        console.log('\nRestore script finished.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nRestore script failed:', error);
        process.exit(1);
    });
