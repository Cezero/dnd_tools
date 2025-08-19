#!/usr/bin/env node
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

import { PrismaClient } from '@shared/prisma-client';


dotenv.config();

const prisma = new PrismaClient();

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cyberdnd_bkp',
    port: process.env.DB_PORT || 3306
};

// Migration state tracking
const migrationSteps = [
    { name: 'sourceBooks', function: 'migrateSourceBooks', dependencies: [] },
    { name: 'itemTypes', function: 'migrateItemTypes', dependencies: [] },
    { name: 'items', function: 'migrateItems', dependencies: ['itemTypes'] },
    { name: 'itemProperties', function: 'migrateItemProperties', dependencies: [] },
    { name: 'itemPropertyAppliesTo', function: 'migrateItemPropertyAppliesTo', dependencies: ['itemProperties'] },
    { name: 'itemPropertyIncompatibilities', function: 'migrateItemPropertyIncompatibilities', dependencies: ['itemProperties'] },
    { name: 'itemTemplates', function: 'migrateItemTemplates', dependencies: ['items'] },
    { name: 'itemTemplateProperties', function: 'migrateItemTemplateProperties', dependencies: ['itemTemplates', 'itemProperties'] },
    { name: 'classes', function: 'migrateClasses', dependencies: [] },
    { name: 'features', function: 'migrateFeatures', dependencies: [] },
    { name: 'featureProgressions', function: 'migrateFeatureProgressions', dependencies: ['classes', 'features'] },
    { name: 'featureModifiers', function: 'migrateFeatureModifiers', dependencies: ['featureProgressions'] },
    { name: 'featureSpecialEffects', function: 'migrateFeatureSpecialEffects', dependencies: ['featureProgressions'] },
    { name: 'featureChoices', function: 'migrateFeatureChoices', dependencies: ['featureProgressions', 'feats'] },
    { name: 'legacyDataFeatures', function: 'migrateLegacyDataFeatures', dependencies: ['features', 'classes', 'races', 'skills', 'feats', 'items'] },
    { name: 'skills', function: 'migrateSkills', dependencies: [] },
    { name: 'classSourceMap', function: 'migrateClassSourceMap', dependencies: ['classes', 'sourceBooks'] },
    { name: 'spells', function: 'migrateSpells', dependencies: [] },
    { name: 'spellLevelMap', function: 'migrateSpellLevelMap', dependencies: ['spells', 'classes'] },
    { name: 'spellDescriptorMap', function: 'migrateSpellDescriptorMap', dependencies: ['spells'] },
    { name: 'spellSchoolMap', function: 'migrateSpellSchoolMap', dependencies: ['spells'] },
    { name: 'spellSourceMap', function: 'migrateSpellSourceMap', dependencies: ['spells', 'sourceBooks'] },
    { name: 'spellSubschoolMap', function: 'migrateSpellSubschoolMap', dependencies: ['spells'] },
    { name: 'spellComponentMap', function: 'migrateSpellComponentMap', dependencies: ['spells'] },
    { name: 'feats', function: 'migrateFeats', dependencies: [] },
    { name: 'featBenefitMap', function: 'migrateFeatBenefitMap', dependencies: ['feats'] },
    { name: 'featPrerequisiteMap', function: 'migrateFeatPrerequisiteMap', dependencies: ['feats'] },
    { name: 'races', function: 'migrateRaces', dependencies: [] },
    { name: 'raceSourceMap', function: 'migrateRaceSourceMap', dependencies: ['races', 'sourceBooks'] },
    { name: 'armor', function: 'migrateArmor', dependencies: ['items'] },
    { name: 'weapons', function: 'migrateWeapons', dependencies: ['items'] },
    { name: 'referenceTables', function: 'migrateReferenceTables', dependencies: [] },
    { name: 'referenceTableColumns', function: 'migrateReferenceTableColumns', dependencies: ['referenceTables'] },
    { name: 'referenceTableRows', function: 'migrateReferenceTableRows', dependencies: ['referenceTables'] },
    { name: 'referenceTableCells', function: 'migrateReferenceTableCells', dependencies: ['referenceTables', 'referenceTableColumns', 'referenceTableRows'] },
    { name: 'diceBoxAdminConfigs', function: 'migrateDiceBoxAdminConfigs', dependencies: [] },
    { name: 'userDiceConfigOverrides', function: 'migrateUserDiceConfigOverrides', dependencies: ['diceBoxAdminConfigs'] },
    { name: 'users', function: 'migrateUsers', dependencies: ['diceBoxAdminConfigs'] },
    { name: 'userCharacters', function: 'migrateUserCharacters', dependencies: ['users', 'races'] },
    { name: 'userCharacterAttributes', function: 'migrateUserCharacterAttributes', dependencies: ['userCharacters'] },
    { name: 'characterItems', function: 'migrateCharacterItems', dependencies: ['userCharacters', 'items'] },
    { name: 'characterItemProperties', function: 'migrateCharacterItemProperties', dependencies: ['characterItems', 'itemProperties'] },
    { name: 'characterAdvancements', function: 'migrateCharacterAdvancements', dependencies: ['userCharacters', 'classes'] },
    { name: 'advancementClassFeatures', function: 'migrateAdvancementClassFeatures', dependencies: ['characterAdvancements', 'features'] },
    { name: 'advancementFeats', function: 'migrateAdvancementFeats', dependencies: ['characterAdvancements', 'feats'] },
    { name: 'advancementSkills', function: 'migrateAdvancementSkills', dependencies: ['characterAdvancements', 'skills'] },
    { name: 'advancementSpells', function: 'migrateAdvancementSpells', dependencies: ['characterAdvancements', 'spells'] },
    // { name: 'characterFeatureChoices', function: 'migrateCharacterFeatureChoices', dependencies: ['characterAdvancements', 'features'] },
    { name: 'characterSpellPreparations', function: 'migrateCharacterSpellPreparations', dependencies: ['userCharacters', 'classes', 'spells'] },
    { name: 'spellPreparationMetamagics', function: 'migrateSpellPreparationMetamagics', dependencies: ['characterSpellPreparations', 'feats'] }
];

// Migration state management
async function createMigrationLogTable() {
    try {
        await prisma.$executeRaw`
            CREATE TABLE IF NOT EXISTS migration_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                step_name VARCHAR(255) NOT NULL UNIQUE,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                error_message TEXT,
                retry_count INT DEFAULT 0
            )
        `;
        console.log('Migration log table ready');
    } catch (error) {
        console.error('Error creating migration log table:', error);
        throw error;
    }
}

async function cleanupMigrationLogTable() {
    try {
        await prisma.$executeRaw`DROP TABLE IF EXISTS migration_log`;
        console.log('✅ Migration log table cleaned up');
    } catch (error) {
        console.error('Error cleaning up migration log table:', error);
        // Don't throw error here as migration was successful
    }
}

async function isStepCompleted(stepName) {
    try {
        const logEntry = await prisma.$queryRaw`
            SELECT * FROM migration_log WHERE step_name = ${stepName}
        `;
        return logEntry.length > 0 && !logEntry[0].error_message;
    } catch (error) {
        console.error(`Error checking migration status for ${stepName}:`, error);
        return false;
    }
}

async function markStepCompleted(stepName) {
    try {
        await prisma.$executeRaw`
            INSERT INTO migration_log (step_name, completed_at) 
            VALUES (${stepName}, NOW())
            ON DUPLICATE KEY UPDATE 
                completed_at = NOW(),
                error_message = NULL,
                retry_count = retry_count + 1
        `;
    } catch (error) {
        console.error(`Error marking step ${stepName} as completed:`, error);
    }
}

async function markStepFailed(stepName, error) {
    try {
        await prisma.$executeRaw`
            INSERT INTO migration_log (step_name, error_message, retry_count) 
            VALUES (${stepName}, ${error.message}, 1)
            ON DUPLICATE KEY UPDATE 
                error_message = ${error.message},
                retry_count = retry_count + 1
        `;
    } catch (logError) {
        console.error(`Error logging failure for step ${stepName}:`, logError);
    }
}

async function getDependencyStatus(dependencies) {
    if (dependencies.length === 0) return true;

    for (const dep of dependencies) {
        const completed = await isStepCompleted(dep);
        if (!completed) {
            console.log(`Dependency ${dep} not completed, skipping...`);
            return false;
        }
    }
    return true;
}

async function executeMigrationStep(step, connection) {
    const { name, function: functionName, dependencies } = step;

    console.log(`\n=== Checking migration step: ${name} ===`);

    // Check if already completed
    const completed = await isStepCompleted(name);
    if (completed) {
        console.log(`✓ Step ${name} already completed, skipping`);
        return true;
    }

    // Check dependencies
    const depsReady = await getDependencyStatus(dependencies);
    if (!depsReady) {
        console.log(`⚠ Step ${name} dependencies not ready, skipping`);
        return false;
    }

    // Execute migration
    console.log(`🔄 Executing migration step: ${name}`);
    try {
        const migrationFunction = global[functionName];
        if (!migrationFunction) {
            throw new Error(`Migration function ${functionName} not found`);
        }

        await migrationFunction(connection);
        await markStepCompleted(name);
        console.log(`✓ Step ${name} completed successfully`);
        return true;
    } catch (error) {
        console.error(`✗ Step ${name} failed:`, error.message);
        await markStepFailed(name, error);
        return false;
    }
}

async function showMigrationStatus() {
    try {
        const status = await prisma.$queryRaw`
            SELECT 
                step_name,
                completed_at,
                error_message,
                retry_count,
                CASE 
                    WHEN completed_at IS NOT NULL AND error_message IS NULL THEN 'COMPLETED'
                    WHEN error_message IS NOT NULL THEN 'FAILED'
                    ELSE 'PENDING'
                END as status
            FROM migration_log 
            ORDER BY completed_at ASC, step_name ASC
        `;

        console.log('\n📋 Migration Status:');
        console.log('==================');

        const completed = status.filter(s => s.status === 'COMPLETED');
        const failed = status.filter(s => s.status === 'FAILED');
        const pending = status.filter(s => s.status === 'PENDING');

        console.log(`✅ Completed: ${completed.length}`);
        console.log(`❌ Failed: ${failed.length}`);
        console.log(`⏳ Pending: ${pending.length}`);

        if (failed.length > 0) {
            console.log('\n❌ Failed Steps:');
            failed.forEach(step => {
                console.log(`  - ${step.step_name}: ${step.error_message} (retries: ${step.retry_count})`);
            });
        }

        if (pending.length > 0) {
            console.log('\n⏳ Pending Steps:');
            pending.forEach(step => {
                console.log(`  - ${step.step_name}`);
            });
        }

        return { completed: completed.length, failed: failed.length, pending: pending.length };
    } catch (error) {
        console.error('Error showing migration status:', error);
        return { completed: 0, failed: 0, pending: 0 };
    }
}

async function resetFailedMigrations() {
    try {
        await prisma.$executeRaw`
            DELETE FROM migration_log WHERE error_message IS NOT NULL
        `;
        console.log('✅ Reset all failed migrations');
    } catch (error) {
        console.error('Error resetting failed migrations:', error);
        throw error;
    }
}

async function resetAllMigrations() {
    try {
        await prisma.$executeRaw`DELETE FROM migration_log`;
        console.log('✅ Reset all migrations');
    } catch (error) {
        console.error('Error resetting all migrations:', error);
        throw error;
    }
}

async function runMigrationWithRetry(connection, maxRetries = 3) {
    let retryCount = 0;
    let allCompleted = false;

    console.log('\n🚀 Starting migration with retry logic...');
    console.log(`📊 Total steps to migrate: ${migrationSteps.length}`);

    // Show initial status
    await showMigrationStatus();

    while (retryCount < maxRetries && !allCompleted) {
        console.log(`\n🔄 Migration attempt ${retryCount + 1}/${maxRetries}`);

        let completedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        for (const step of migrationSteps) {
            const result = await executeMigrationStep(step, connection);
            if (result === true) {
                completedCount++;
            } else if (result === false) {
                failedCount++;
            } else {
                skippedCount++;
            }
        }

        console.log(`\n📊 Migration attempt ${retryCount + 1} results:`);
        console.log(`  Completed: ${completedCount}`);
        console.log(`  Skipped: ${skippedCount}`);
        console.log(`  Failed: ${failedCount}`);

        if (failedCount === 0) {
            allCompleted = true;
            console.log(`\n🎉 All migrations completed successfully!`);
        } else {
            retryCount++;
            if (retryCount < maxRetries) {
                console.log(`\n⏳ Waiting 5 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    // Show final status
    await showMigrationStatus();

    if (!allCompleted) {
        console.log(`\n❌ Migration failed after ${maxRetries} attempts`);
        console.log(`Check the migration_log table for details on failed steps`);
        console.log(`You can re-run the script to retry failed steps`);
        throw new Error('Migration failed');
    }
}

async function connectToOldDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to old database');
        return connection;
    } catch (error) {
        console.error('Error connecting to old database:', error);
        throw error;
    }
}

// Transform functions for each table
async function migrateSourceBooks(connection) {
    console.log('Migrating source books...');
    const [rows] = await connection.execute(`
        SELECT id, name, abbreviation, releaseDate, 
               editionId, description, isVisible
        FROM SourceBook
    `);

    for (const row of rows) {
        const data = {
            ...row,
            releaseDate: row.releaseDate ? new Date(row.releaseDate) : null,
            isVisible: Boolean(row.isVisible)
        };

        await prisma.sourceBook.upsert({
            where: { id: row.id },
            update: data,
            create: data
        });
    }
    console.log(`Migrated ${rows.length} source books`);
}

async function migrateClasses(connection) {
    console.log('Migrating classes...');
    const [rows] = await connection.execute(`
        SELECT id, name, abbreviation, editionId, isPrestige, isVisible, canCastSpells,
               hitDie, description, skillPoints, castingAbilityId, babProgression,
               fortProgression, refProgression, willProgression
        FROM Class
    `);

    for (const row of rows) {
        const data = {
            ...row,
            isPrestige: Boolean(row.isPrestige),
            isVisible: Boolean(row.isVisible),
            canCastSpells: Boolean(row.canCastSpells)
        };

        await prisma.class.upsert({
            where: { id: row.id },
            update: data,
            create: data
        });
    }
    console.log(`Migrated ${rows.length} classes`);
}

async function migrateFeatures(connection) {
    console.log('Migrating features...');

    // Migrate ClassFeature to Feature (sourceType = 1 for Class)
    const [classFeatures] = await connection.execute(`
        SELECT slug, name, description
        FROM ClassFeature
    `);

    for (const row of classFeatures) {
        await prisma.feature.upsert({
            where: { slug: row.slug },
            update: {
                slug: row.slug,
                name: row.name,
                description: row.description
            },
            create: {
                slug: row.slug,
                name: row.name,
                description: row.description
            }
        });
    }
    console.log(`Migrated ${classFeatures.length} class features`);

    // Migrate RaceTrait to Feature (sourceType = 0 for Race)
    const [raceTraits] = await connection.execute(`
        SELECT slug, name, description
        FROM RaceTrait
    `);

    for (const row of raceTraits) {
        await prisma.feature.upsert({
            where: { slug: row.slug },
            update: {
                slug: row.slug,
                name: row.name,
                description: row.description
            },
            create: {
                slug: row.slug,
                name: row.name,
                description: row.description
            }
        });
    }
    console.log(`Migrated ${raceTraits.length} race traits`);
}

async function migrateFeatureProgressions(connection) {
    console.log('Migrating feature progressions...');

    // Migrate ClassFeatureMap to FeatureProgression (sourceType = 1 for Class)
    const [classFeatureMaps] = await connection.execute(`
        SELECT classId, featureSlug, level
        FROM ClassFeatureMap
    `);

    for (const row of classFeatureMaps) {
        // Get the feature ID from the slug
        const feature = await prisma.feature.findUnique({
            where: { slug: row.featureSlug }
        });

        if (feature) {
            // Check if progression already exists
            const existingProgression = await prisma.featureProgression.findFirst({
                where: {
                    sourceType: 1, // Class
                    level: row.level,
                    featureId: feature.id,
                    classId: row.classId
                }
            });

            if (!existingProgression) {
                await prisma.featureProgression.create({
                    data: {
                        sourceType: 1, // Class
                        level: row.level,
                        featureId: feature.id,
                        classId: row.classId
                    }
                });
            }
        } else {
            console.log(`Warning: Feature with slug '${row.featureSlug}' not found`);
        }
    }
    console.log(`Migrated ${classFeatureMaps.length} class feature mappings`);

    // Migrate ClassFeatureProgression to FeatureProgression
    const [classFeatureProgressions] = await connection.execute(`
        SELECT featureSlug, classId, level, aspect, valueInt, valueString, note
        FROM ClassFeatureProgression
    `);

    for (const row of classFeatureProgressions) {
        // Get the feature ID from the slug
        const feature = await prisma.feature.findUnique({
            where: { slug: row.featureSlug }
        });

        if (feature) {
            // Check if progression already exists
            const existingProgression = await prisma.featureProgression.findFirst({
                where: {
                    sourceType: 1, // Class
                    level: row.level,
                    featureId: feature.id,
                    classId: row.classId
                }
            });

            let progression;
            if (existingProgression) {
                progression = existingProgression;
            } else {
                progression = await prisma.featureProgression.create({
                    data: {
                        sourceType: 1, // Class
                        level: row.level,
                        featureId: feature.id,
                        classId: row.classId
                    }
                });
            }

            // Handle different aspects based on the aspect field
            if (row.aspect === 'choice' && row.valueString) {
                // Create a choice record
                await prisma.featureChoice.create({
                    data: {
                        progressionId: progression.id,
                        label: row.valueString,
                        pickCount: 1,
                        choiceType: 'Feat', // Default, may need adjustment
                        choiceBehavior: 'Single'
                    }
                });
            } else if (row.aspect === 'bonusFeat') {
                // Handle bonus feat as a special case
                // Update the progression with appliesToType and appliesTo
                const featChoiceFilter = row.valueString || 'Any'; // Default to Any if not specified
                const appliesToValue = featChoiceFilter === 'FighterBonus' ? 1 :
                    featChoiceFilter === 'MetamagicOrItemCreation' ? 2 : 0; // Any = 0

                await prisma.featureProgression.update({
                    where: { id: progression.id },
                    data: {
                        appliesToType: 4, // Feat (from FeatureAppliesToType)
                        appliesTo: appliesToValue
                    }
                });

                // Create a feature choice for the feat selection
                await prisma.featureChoice.create({
                    data: {
                        progressionId: progression.id,
                        label: 'Bonus Feat',
                        pickCount: 1,
                        choiceType: 'Feat',
                        choiceBehavior: 'Single'
                    }
                });
            } else if (row.aspect === 'effect' || ['favored_enemy', 'turn_undead', 'wild_shape_form', 'wild_shape_size', 'form', 'size'].includes(row.aspect)) {
                // Create a special effect record
                try {
                    await prisma.featureSpecialEffect.create({
                        data: {
                            progressionId: progression.id,
                            effectType: mapAspectToEffectType(row.aspect),
                            key: row.aspect,
                            value: row.valueString,
                            numericValue: row.valueInt
                        }
                    });
                } catch (_error) {
                    console.error(`❌ CRITICAL ERROR: Unmapped aspect '${row.aspect}' encountered during migration.`);
                    console.error(`   Migration aborted to prevent data loss.`);
                    console.error(`   Please update the mapping function and re-run the migration.`);
                    process.exit(1);
                }
            } else if (row.valueString || row.valueInt) {
                // Create a modifier record
                try {
                    await prisma.featureModifier.create({
                        data: {
                            featureProgressionId: progression.id,
                            modifierType: mapAspectToModifierType(row.aspect),
                            value: row.valueInt || 0
                        }
                    });
                } catch (_error) {
                    console.error(`❌ CRITICAL ERROR: Unmapped aspect '${row.aspect}' encountered during migration.`);
                    console.error(`   Migration aborted to prevent data loss.`);
                    console.error(`   Please update the mapping function and re-run the migration.`);
                    process.exit(1);
                }
            }
        } else {
            console.log(`Warning: Feature with slug '${row.featureSlug}' not found`);
        }
    }
    console.log(`Migrated ${classFeatureProgressions.length} class feature progression records`);

    // Migrate RaceTraitMap to FeatureProgression (sourceType = 0 for Race)
    const [raceTraitMaps] = await connection.execute(`
        SELECT raceId, traitSlug, value
        FROM RaceTraitMap
    `);

    for (const row of raceTraitMaps) {
        // Get the feature ID from the slug
        const feature = await prisma.feature.findUnique({
            where: { slug: row.traitSlug }
        });

        if (feature) {
            // Check if progression already exists
            const existingProgression = await prisma.featureProgression.findFirst({
                where: {
                    sourceType: 0, // Race
                    level: 1, // Race traits are always level 1
                    featureId: feature.id,
                    raceId: row.raceId
                }
            });

            if (!existingProgression) {
                await prisma.featureProgression.create({
                    data: {
                        sourceType: 0, // Race
                        level: 1, // Race traits are always level 1
                        featureId: feature.id,
                        raceId: row.raceId
                    }
                });
            }
        } else {
            console.log(`Warning: Feature with slug '${row.traitSlug}' not found`);
        }
    }
    console.log(`Migrated ${raceTraitMaps.length} race trait mappings`);
}

async function migrateFeatureModifiers(connection) {
    console.log('Migrating feature modifiers...');

    // Check if ClassFeatureModifier table exists
    try {
        const [classFeatureModifiers] = await connection.execute(`
            SELECT featureProgressionId, modifierType, value, appliesIfChoiceKey, appliesIfChoiceValue
            FROM ClassFeatureModifier
        `);

        for (const row of classFeatureModifiers) {
            // Check if modifier already exists
            const existingModifier = await prisma.featureModifier.findFirst({
                where: {
                    featureProgressionId: row.featureProgressionId,
                    modifierType: row.modifierType
                }
            });

            if (!existingModifier) {
                await prisma.featureModifier.create({
                    data: {
                        featureProgressionId: row.featureProgressionId,
                        modifierType: row.modifierType,
                        value: row.value,
                        appliesIfChoiceKey: row.appliesIfChoiceKey,
                        appliesIfChoiceValue: row.appliesIfChoiceValue
                    }
                });
            }
        }
        console.log(`Migrated ${classFeatureModifiers.length} class feature modifiers`);
    } catch (_error) {
        console.log('ClassFeatureModifier table does not exist, skipping...');
    }

    // Convert RaceTraitMap.value to FeatureModifier with type "Distance"
    // Get RaceTraitMap data from backup database
    const [raceTraitMaps] = await connection.execute(`
        SELECT raceId, traitSlug, value
        FROM RaceTraitMap
        WHERE value IS NOT NULL AND value > 0
    `);

    for (const row of raceTraitMaps) {
        // Find the corresponding feature progression in the new database
        const feature = await prisma.feature.findUnique({
            where: { slug: row.traitSlug }
        });

        if (feature) {
            const progression = await prisma.featureProgression.findFirst({
                where: {
                    sourceType: 0, // Race
                    level: 1, // Race traits are always level 1
                    featureId: feature.id,
                    raceId: row.raceId
                }
            });

            if (progression) {
                // Check if modifier already exists
                const existingModifier = await prisma.featureModifier.findFirst({
                    where: {
                        featureProgressionId: progression.id,
                        modifierType: 3 // Distance
                    }
                });

                if (!existingModifier) {
                    await prisma.featureModifier.create({
                        data: {
                            featureProgressionId: progression.id,
                            modifierType: 3, // Distance
                            value: row.value
                        }
                    });
                }
            }
        }
    }
    console.log(`Migrated ${raceTraitMaps.length} race trait value modifiers`);
}

async function migrateFeatureSpecialEffects(connection) {
    console.log('Migrating feature special effects...');

    // Check if ClassFeatureSpecialEffect table exists
    try {
        const [classFeatureSpecialEffects] = await connection.execute(`
            SELECT progressionId, effectType, \`key\`, value, numericValue
            FROM ClassFeatureSpecialEffect
        `);

        for (const row of classFeatureSpecialEffects) {
            // Check if effect already exists
            const existingEffect = await prisma.featureSpecialEffect.findFirst({
                where: {
                    progressionId: row.progressionId,
                    effectType: row.effectType,
                    key: row.key
                }
            });

            if (!existingEffect) {
                await prisma.featureSpecialEffect.create({
                    data: {
                        progressionId: row.progressionId,
                        effectType: row.effectType,
                        key: row.key,
                        value: row.value,
                        numericValue: row.numericValue
                    }
                });
            }
        }
        console.log(`Migrated ${classFeatureSpecialEffects.length} feature special effects`);
    } catch (_error) {
        console.log('ClassFeatureSpecialEffect table does not exist, skipping...');
    }
}

async function migrateFeatureChoices(connection) {
    console.log('Migrating feature choices...');

    // Check if ClassFeatureChoice table exists
    try {
        const [classFeatureChoices] = await connection.execute(`
            SELECT id, progressionId, label, pickCount, choiceType, choiceBehavior, featId, chosenFeatureId
            FROM ClassFeatureChoice
        `);

        for (const row of classFeatureChoices) {
            // Check if choice already exists
            const existingChoice = await prisma.featureChoice.findUnique({
                where: { id: row.id }
            });

            if (!existingChoice) {
                await prisma.featureChoice.create({
                    data: {
                        id: row.id,
                        progressionId: row.progressionId,
                        label: row.label,
                        pickCount: row.pickCount,
                        choiceType: row.choiceType,
                        choiceBehavior: row.choiceBehavior,
                        featId: row.featId,
                        chosenFeatureId: row.chosenFeatureId
                    }
                });
            }
        }
        console.log(`Migrated ${classFeatureChoices.length} feature choices`);
    } catch (_error) {
        console.log('ClassFeatureChoice table does not exist, skipping...');
    }
}

async function migrateLegacyDataFeatures(connection) {
    console.log('Migrating legacy data to unified feature system...');

    // 1. Migrate ClassProficiencies to Features
    const [classProficiencies] = await connection.execute(`
        SELECT DISTINCT cp.classId, cp.featId, cp.itemId, 
               f.name as featName, i.name as itemName
        FROM ClassProficiencies cp
        LEFT JOIN Feat f ON cp.featId = f.id
        LEFT JOIN Item i ON cp.itemId = i.id
    `);

    for (const row of classProficiencies) {
        // Create a feature for this proficiency
        const featureSlug = `proficiency_${row.classId}_${row.featId}_${row.itemId}`;
        const featureName = `${row.featName || 'Proficiency'} - ${row.itemName || 'Item'}`;

        await prisma.feature.upsert({
            where: { slug: featureSlug },
            update: {
                name: featureName,
                description: `Proficiency in ${row.itemName || 'item'} granted by ${row.featName || 'feat'}`
            },
            create: {
                slug: featureSlug,
                name: featureName,
                description: `Proficiency in ${row.itemName || 'item'} granted by ${row.featName || 'feat'}`
            }
        });

        // Create feature progression (level 1 for proficiencies)
        const feature = await prisma.feature.findUnique({
            where: { slug: featureSlug }
        });

        if (feature) {
            const existingProgression = await prisma.featureProgression.findFirst({
                where: {
                    sourceType: 1, // Class
                    level: 1,
                    featureId: feature.id,
                    classId: row.classId
                }
            });

            if (!existingProgression) {
                await prisma.featureProgression.create({
                    data: {
                        sourceType: 1, // Class
                        level: 1,
                        featureId: feature.id,
                        classId: row.classId
                    }
                });
            }
        }
    }
    console.log(`Migrated ${classProficiencies.length} class proficiencies to features`);

    // 2. Migrate ClassSkillMap to Features
    const [classSkillMaps] = await connection.execute(`
        SELECT csm.classId, csm.skillId, s.name as skillName
        FROM ClassSkillMap csm
        JOIN Skill s ON csm.skillId = s.id
    `);

    for (const row of classSkillMaps) {
        // Create a feature for this skill access
        const featureSlug = `skill_access_${row.classId}_${row.skillId}`;
        const featureName = `Access to ${row.skillName}`;

        await prisma.feature.upsert({
            where: { slug: featureSlug },
            update: {
                name: featureName,
                description: `Class skill access to ${row.skillName}`
            },
            create: {
                slug: featureSlug,
                name: featureName,
                description: `Class skill access to ${row.skillName}`
            }
        });

        // Create feature progression (level 1 for skill access)
        const feature = await prisma.feature.findUnique({
            where: { slug: featureSlug }
        });

        if (feature) {
            const existingProgression = await prisma.featureProgression.findFirst({
                where: {
                    sourceType: 1, // Class
                    level: 1,
                    featureId: feature.id,
                    classId: row.classId
                }
            });

            if (!existingProgression) {
                await prisma.featureProgression.create({
                    data: {
                        sourceType: 1, // Class
                        level: 1,
                        featureId: feature.id,
                        classId: row.classId
                    }
                });
            }
        }
    }
    console.log(`Migrated ${classSkillMaps.length} class skill mappings to features`);

    // 3. Migrate RaceAbilityAdjustments to Features
    const [raceAbilityAdjustments] = await connection.execute(`
        SELECT raa.raceId, raa.abilityId, raa.value
        FROM RaceAbilityAdjustment raa
    `);

    for (const row of raceAbilityAdjustments) {
        // Create a feature for this ability adjustment
        const featureSlug = `ability_adjustment_${row.raceId}_${row.abilityId}`;
        const abilityNames = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma'];
        const abilityName = abilityNames[row.abilityId - 1] || `Ability ${row.abilityId}`;
        const featureName = `${abilityName} ${row.value > 0 ? '+' : ''}${row.value}`;

        await prisma.feature.upsert({
            where: { slug: featureSlug },
            update: {
                name: featureName,
                description: `Racial ability adjustment: ${abilityName} ${row.value > 0 ? '+' : ''}${row.value}`
            },
            create: {
                slug: featureSlug,
                name: featureName,
                description: `Racial ability adjustment: ${abilityName} ${row.value > 0 ? '+' : ''}${row.value}`
            }
        });

        // Create feature progression and modifier
        const feature = await prisma.feature.findUnique({
            where: { slug: featureSlug }
        });

        if (feature) {
            const existingProgression = await prisma.featureProgression.findFirst({
                where: {
                    sourceType: 0, // Race
                    level: 1,
                    featureId: feature.id,
                    raceId: row.raceId
                }
            });

            let progression;
            if (!existingProgression) {
                progression = await prisma.featureProgression.create({
                    data: {
                        sourceType: 0, // Race
                        level: 1,
                        featureId: feature.id,
                        raceId: row.raceId
                    }
                });
            } else {
                progression = existingProgression;
            }

            // Create modifier for the ability adjustment
            const existingModifier = await prisma.featureModifier.findFirst({
                where: {
                    featureProgressionId: progression.id,
                    modifierType: 0 // FlatBonus
                }
            });

            if (!existingModifier) {
                await prisma.featureModifier.create({
                    data: {
                        featureProgressionId: progression.id,
                        modifierType: 0, // FlatBonus
                        value: row.value
                    }
                });
            }
        }
    }
    console.log(`Migrated ${raceAbilityAdjustments.length} race ability adjustments to features`);

    // 4. Migrate RaceLanguageMap to Features
    const [raceLanguageMaps] = await connection.execute(`
        SELECT rlm.raceId, rlm.languageId, rlm.isAutomatic
        FROM RaceLanguageMap rlm
    `);

    for (const row of raceLanguageMaps) {
        // Create a feature for this language access
        const featureSlug = `language_${row.raceId}_${row.languageId}`;
        const featureName = `Language ${row.languageId}${row.isAutomatic ? ' (Automatic)' : ''}`;

        await prisma.feature.upsert({
            where: { slug: featureSlug },
            update: {
                name: featureName,
                description: `Language access${row.isAutomatic ? ' (automatic)' : ''}`
            },
            create: {
                slug: featureSlug,
                name: featureName,
                description: `Language access${row.isAutomatic ? ' (automatic)' : ''}`
            }
        });

        // Create feature progression
        const feature = await prisma.feature.findUnique({
            where: { slug: featureSlug }
        });

        if (feature) {
            const existingProgression = await prisma.featureProgression.findFirst({
                where: {
                    sourceType: 0, // Race
                    level: 1,
                    featureId: feature.id,
                    raceId: row.raceId
                }
            });

            if (!existingProgression) {
                await prisma.featureProgression.create({
                    data: {
                        sourceType: 0, // Race
                        level: 1,
                        featureId: feature.id,
                        raceId: row.raceId
                    }
                });
            }
        }
    }
    console.log(`Migrated ${raceLanguageMaps.length} race language mappings to features`);
}

async function migrateSkills(connection) {
    console.log('Migrating skills...');
    const [rows] = await connection.execute(`
        SELECT id, name, abilityId, checkDescription,
               actionDescription, retryTypeId,
               retryDescription, specialNotes,
               synergyNotes, untrainedNotes,
               affectedByArmor, description,
               trainedOnly
        FROM Skill
    `);

    for (const row of rows) {
        const data = {
            ...row,
            affectedByArmor: Boolean(row.affectedByArmor),
            trainedOnly: row.trainedOnly ? Boolean(row.trainedOnly) : null
        };

        await prisma.skill.upsert({
            where: { id: row.id },
            update: data,
            create: data
        });
    }
    console.log(`Migrated ${rows.length} skills`);
}



async function migrateClassSourceMap(connection) {
    console.log('Migrating class source mappings...');
    const [rows] = await connection.execute(`
        SELECT classId, sourceBookId, pageNumber
        FROM ClassSourceMap
    `);

    for (const row of rows) {
        await prisma.classSourceMap.upsert({
            where: {
                classId_sourceBookId: {
                    classId: row.classId,
                    sourceBookId: row.sourceBookId
                }
            },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} class source mappings`);
}

async function migrateSpells(connection) {
    console.log('Migrating spells...');
    const [rows] = await connection.execute(`
        SELECT id, name, summary, description, castingTime,
               \`range\`, rangeTypeId, rangeValue,
               area, duration, savingThrow,
               spellResistance, editionId, baseLevel,
               effect, target
        FROM Spell
    `);

    for (const row of rows) {
        await prisma.spell.upsert({
            where: { id: row.id },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} spells`);
}

async function migrateSpellLevelMap(connection) {
    console.log('Migrating spell level mappings...');
    const [rows] = await connection.execute(`
        SELECT spellId, classId, level, isVisible
        FROM SpellLevelMap
    `);

    for (const row of rows) {
        const data = {
            ...row,
            isVisible: Boolean(row.isVisible)
        };

        await prisma.spellLevelMap.upsert({
            where: {
                spellId_classId: {
                    spellId: row.spellId,
                    classId: row.classId
                }
            },
            update: data,
            create: data
        });
    }
    console.log(`Migrated ${rows.length} spell level mappings`);
}

async function migrateSpellDescriptorMap(connection) {
    console.log('Migrating spell descriptor mappings...');
    const [rows] = await connection.execute(`
        SELECT spellId, descriptorId
        FROM SpellDescriptorMap
    `);

    for (const row of rows) {
        await prisma.spellDescriptorMap.upsert({
            where: {
                spellId_descriptorId: {
                    spellId: row.spellId,
                    descriptorId: row.descriptorId
                }
            },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} spell descriptor mappings`);
}

async function migrateSpellSchoolMap(connection) {
    console.log('Migrating spell school mappings...');
    const [rows] = await connection.execute(`
        SELECT spellId, schoolId
        FROM SpellSchoolMap
    `);

    for (const row of rows) {
        await prisma.spellSchoolMap.upsert({
            where: {
                spellId_schoolId: {
                    spellId: row.spellId,
                    schoolId: row.schoolId
                }
            },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} spell school mappings`);
}

async function migrateSpellSourceMap(connection) {
    console.log('Migrating spell source mappings...');
    const [rows] = await connection.execute(`
        SELECT spellId, sourceBookId, pageNumber
        FROM SpellSourceMap
    `);

    for (const row of rows) {
        await prisma.spellSourceMap.upsert({
            where: {
                spellId_sourceBookId: {
                    spellId: row.spellId,
                    sourceBookId: row.sourceBookId
                }
            },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} spell source mappings`);
}

async function migrateSpellSubschoolMap(connection) {
    console.log('Migrating spell subschool mappings...');
    const [rows] = await connection.execute(`
        SELECT spellId, subSchoolId
        FROM SpellSubschoolMap
    `);

    for (const row of rows) {
        await prisma.spellSubschoolMap.upsert({
            where: {
                spellId_subSchoolId: {
                    spellId: row.spellId,
                    subSchoolId: row.subSchoolId
                }
            },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} spell subschool mappings`);
}

async function migrateSpellComponentMap(connection) {
    console.log('Migrating spell component mappings...');
    const [rows] = await connection.execute(`
        SELECT spellId, componentId
        FROM SpellComponentMap
    `);

    for (const row of rows) {
        await prisma.spellComponentMap.upsert({
            where: {
                spellId_componentId: {
                    spellId: row.spellId,
                    componentId: row.componentId
                }
            },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} spell component mappings`);
}

async function migrateFeats(connection) {
    console.log('Migrating feats...');
    const [rows] = await connection.execute(`
        SELECT id, name, typeId, description, benefit,
               normalEffect, specialEffect,
               prerequisites, repeatable,
               fighterBonus
        FROM Feat
    `);

    for (const row of rows) {
        const data = {
            ...row,
            repeatable: row.repeatable ? Boolean(row.repeatable) : null,
            fighterBonus: row.fighterBonus ? Boolean(row.fighterBonus) : null
        };

        await prisma.feat.upsert({
            where: { id: row.id },
            update: data,
            create: data
        });
    }
    console.log(`Migrated ${rows.length} feats`);
}

async function migrateFeatBenefitMap(connection) {
    console.log('Migrating feat benefit mappings...');
    const [rows] = await connection.execute(`
        SELECT featId, typeId, referenceId,
               amount, \`index\`
        FROM FeatBenefitMap
    `);

    for (const row of rows) {
        await prisma.featBenefitMap.upsert({
            where: { featId_index: { featId: row.featId, index: row.index } },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} feat benefit mappings`);
}

async function migrateFeatPrerequisiteMap(connection) {
    console.log('Migrating feat prerequisite mappings...');
    const [rows] = await connection.execute(`
        SELECT featId, typeId, referenceId,
               amount, \`index\`
        FROM FeatPrerequisiteMap
    `);

    for (const row of rows) {
        await prisma.featPrerequisiteMap.upsert({
            where: { featId_index: { featId: row.featId, index: row.index } },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} feat prerequisite mappings`);
}

async function migrateRaces(connection) {
    console.log('Migrating races...');
    const [rows] = await connection.execute(`
        SELECT id, name, editionId, isVisible,
               description, sizeId, speed, favoredClassId
        FROM Race
    `);

    for (const row of rows) {
        const data = {
            ...row,
            isVisible: Boolean(row.isVisible)
        };

        await prisma.race.upsert({
            where: { id: row.id },
            update: data,
            create: data
        });
    }
    console.log(`Migrated ${rows.length} races`);
}





async function migrateRaceSourceMap(connection) {
    console.log('Migrating race source mappings...');
    const [rows] = await connection.execute(`
        SELECT raceId, sourceBookId, pageNumber
        FROM RaceSourceMap
    `);

    for (const row of rows) {
        await prisma.raceSourceMap.upsert({
            where: {
                raceId_sourceBookId: {
                    raceId: row.raceId,
                    sourceBookId: row.sourceBookId
                }
            },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} race source mappings`);
}

async function migrateArmor(connection) {
    console.log('Migrating armor...');
    const [rows] = await connection.execute(`
        SELECT id, category, bonus, dexterityCap, checkPenalty,
               arcaneSpellFailure, speedCapThirty, speedCapTwenty
        FROM Armor
    `);

    for (const row of rows) {
        await prisma.armor.upsert({
            where: { id: row.id },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} armor items`);
}

async function migrateWeapons(connection) {
    console.log('Migrating weapons...');
    const [rows] = await connection.execute(`
        SELECT id, category, damageSmall, damageMedium, critical,
               \`range\`, \`type\`, attackBonus, damageType, reach, \`double\`, nonlethal
        FROM Weapon
    `);

    for (const row of rows) {
        const data = {
            ...row,
            reach: Boolean(row.reach),
            double: Boolean(row.double),
            nonlethal: Boolean(row.nonlethal)
        };

        await prisma.weapon.upsert({
            where: { id: row.id },
            update: data,
            create: data
        });
    }
    console.log(`Migrated ${rows.length} weapons`);
}

async function migrateReferenceTables(connection) {
    console.log('Migrating reference tables...');
    const [rows] = await connection.execute(`
        SELECT slug, name, description
        FROM ReferenceTable
    `);

    for (const row of rows) {
        await prisma.referenceTable.upsert({
            where: { slug: row.slug },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} reference tables`);
}

async function migrateReferenceTableColumns(connection) {
    console.log('Migrating reference table columns...');
    const [rows] = await connection.execute(`
        SELECT rt.slug as tableSlug, rtc.\`index\`, rtc.header, rtc.span, rtc.alignment
        FROM ReferenceTableColumn rtc
        JOIN ReferenceTable rt ON rtc.tableSlug = rt.slug
        `);

    for (const row of rows) {
        await prisma.referenceTableColumn.upsert({
            where: {
                tableSlug_index: {
                    tableSlug: row.tableSlug,
                    index: row.index
                }
            },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} reference table columns`);
}

async function migrateReferenceTableRows(connection) {
    console.log('Migrating reference table rows...');
    const [rows] = await connection.execute(`
        SELECT rt.slug as tableSlug, rtr.\`index\`
        FROM ReferenceTableRow rtr
        JOIN ReferenceTable rt ON rtr.tableSlug = rt.slug
    `);

    for (const row of rows) {
        await prisma.referenceTableRow.upsert({
            where: {
                tableSlug_index: {
                    tableSlug: row.tableSlug,
                    index: row.index
                }
            },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} reference table rows`);
}

async function migrateReferenceTableCells(connection) {
    console.log('Migrating reference table cells...');
    const [rows] = await connection.execute(`
        SELECT rt.slug as tableSlug, rtcol.\`index\` as columnIndex, rtr.\`index\` as rowIndex, 
               rtc.value, rtc.colSpan, rtc.rowSpan
        FROM ReferenceTableCell rtc
        JOIN ReferenceTableColumn rtcol ON rtcol.tableSlug = rtc.tableSlug AND rtcol.\`index\` = rtc.columnIndex
        JOIN ReferenceTableRow rtr ON rtr.tableSlug = rtc.tableSlug AND rtr.\`index\` = rtc.rowIndex
        JOIN ReferenceTable rt ON rt.slug = rtc.tableSlug
    `);

    for (const row of rows) {
        await prisma.referenceTableCell.upsert({
            where: {
                tableSlug_columnIndex_rowIndex: {
                    tableSlug: row.tableSlug,
                    columnIndex: row.columnIndex,
                    rowIndex: row.rowIndex
                }
            },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} reference table cells`);
}

async function migrateUsers(connection) {
    console.log('Migrating users...');
    const [rows] = await connection.execute(`
        SELECT id, username, email, password, isAdmin,
               createdAt, updatedAt,
               preferredEditionId
        FROM User
    `);

    for (const row of rows) {
        const data = {
            ...row,
            isAdmin: Boolean(row.isAdmin),
            createdAt: new Date(row.createdAt),
            updatedAt: new Date(row.updatedAt)
        };

        await prisma.user.upsert({
            where: { id: row.id },
            update: data,
            create: data
        });
    }
    console.log(`Migrated ${rows.length} users`);
}

async function migrateUserCharacters(connection) {
    console.log('Migrating user characters...');
    const [rows] = await connection.execute(`
        SELECT id, userId, name, raceId,
               alignmentId, age, height, weight, eyes, hair, gender
        FROM UserCharacter
    `);

    for (const row of rows) {
        await prisma.userCharacter.upsert({
            where: { id: row.id },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} user characters`);
}

async function migrateUserCharacterAttributes(connection) {
    console.log('Migrating user character attributes...');
    const [rows] = await connection.execute(`
        SELECT characterId, attributeId, value
        FROM UserCharacterAttribute
    `);

    for (const row of rows) {
        await prisma.userCharacterAttribute.create({
            data: {
                characterId: row.characterId,
                attributeId: row.attributeId,
                value: row.value
            }
        });
    }
    console.log(`Migrated ${rows.length} user character attributes`);
}

// =================
// Item System Migrations
// =================

async function migrateItemTypes(connection) {
    console.log('Migrating item types...');
    const [rows] = await connection.execute(`
        SELECT id, name
        FROM ItemType
    `);

    for (const row of rows) {
        await prisma.itemType.upsert({
            where: { id: row.id },
            update: {
                name: row.name
            },
            create: {
                id: row.id,
                name: row.name
            }
        });
    }
    console.log(`Migrated ${rows.length} item types`);
}

async function migrateItems(connection) {
    console.log('Migrating items...');
    const [rows] = await connection.execute(`
        SELECT id, name, description, cost, weight, quantity, typeId
        FROM Item
    `);

    for (const row of rows) {
        await prisma.item.upsert({
            where: { id: row.id },
            update: {
                name: row.name,
                description: row.description,
                cost: row.cost,
                weight: row.weight,
                quantity: row.quantity,
                typeId: row.typeId
            },
            create: {
                id: row.id,
                name: row.name,
                description: row.description,
                cost: row.cost,
                weight: row.weight,
                quantity: row.quantity,
                typeId: row.typeId
            }
        });
    }
    console.log(`Migrated ${rows.length} items`);
}

async function migrateItemProperties(connection) {
    console.log('Migrating item properties...');
    const [rows] = await connection.execute(`
        SELECT id, name, type, flatCostModifier, costMultiplier, costFormula,
               enhancementBonusValue, bonusEquivalentModifier, exclusiveMaterial
        FROM ItemProperty
    `);

    for (const row of rows) {
        await prisma.itemProperty.upsert({
            where: { id: row.id },
            update: {
                name: row.name,
                type: row.type,
                flatCostModifier: row.flatCostModifier,
                costMultiplier: row.costMultiplier,
                costFormula: row.costFormula,
                enhancementBonusValue: row.enhancementBonusValue,
                bonusEquivalentModifier: row.bonusEquivalentModifier,
                exclusiveMaterial: Boolean(row.exclusiveMaterial)
            },
            create: {
                id: row.id,
                name: row.name,
                type: row.type,
                flatCostModifier: row.flatCostModifier,
                costMultiplier: row.costMultiplier,
                costFormula: row.costFormula,
                enhancementBonusValue: row.enhancementBonusValue,
                bonusEquivalentModifier: row.bonusEquivalentModifier,
                exclusiveMaterial: Boolean(row.exclusiveMaterial)
            }
        });
    }
    console.log(`Migrated ${rows.length} item properties`);
}

async function migrateItemPropertyAppliesTo(connection) {
    console.log('Migrating item property applies to...');
    const [rows] = await connection.execute(`
        SELECT id, propertyId, itemType
        FROM ItemPropertyAppliesTo
    `);

    for (const row of rows) {
        await prisma.itemPropertyAppliesTo.upsert({
            where: { id: row.id },
            update: {
                propertyId: row.propertyId,
                itemType: row.itemType
            },
            create: {
                id: row.id,
                propertyId: row.propertyId,
                itemType: row.itemType
            }
        });
    }
    console.log(`Migrated ${rows.length} item property applies to`);
}

async function migrateItemPropertyIncompatibilities(connection) {
    console.log('Migrating item property incompatibilities...');
    const [rows] = await connection.execute(`
        SELECT id, propertyAId, propertyBId
        FROM ItemPropertyIncompatibility
    `);

    for (const row of rows) {
        await prisma.itemPropertyIncompatibility.upsert({
            where: { id: row.id },
            update: {
                propertyAId: row.propertyAId,
                propertyBId: row.propertyBId
            },
            create: {
                id: row.id,
                propertyAId: row.propertyAId,
                propertyBId: row.propertyBId
            }
        });
    }
    console.log(`Migrated ${rows.length} item property incompatibilities`);
}

async function migrateItemTemplates(connection) {
    console.log('Migrating item templates...');
    const [rows] = await connection.execute(`
        SELECT id, name, itemId
        FROM ItemTemplate
    `);

    for (const row of rows) {
        await prisma.itemTemplate.upsert({
            where: { id: row.id },
            update: {
                name: row.name,
                itemId: row.itemId
            },
            create: {
                id: row.id,
                name: row.name,
                itemId: row.itemId
            }
        });
    }
    console.log(`Migrated ${rows.length} item templates`);
}

async function migrateItemTemplateProperties(connection) {
    console.log('Migrating item template properties...');
    const [rows] = await connection.execute(`
        SELECT id, templateId, propertyId
        FROM ItemTemplateProperty
    `);

    for (const row of rows) {
        await prisma.itemTemplateProperty.upsert({
            where: { id: row.id },
            update: {
                templateId: row.templateId,
                propertyId: row.propertyId
            },
            create: {
                id: row.id,
                templateId: row.templateId,
                propertyId: row.propertyId
            }
        });
    }
    console.log(`Migrated ${rows.length} item template properties`);
}

async function migrateCharacterItems(connection) {
    console.log('Migrating character items...');
    const [rows] = await connection.execute(`
        SELECT id, name, quantity, characterId, baseItemId
        FROM CharacterItem
    `);

    for (const row of rows) {
        await prisma.characterItem.upsert({
            where: { id: row.id },
            update: {
                name: row.name,
                quantity: row.quantity,
                characterId: row.characterId,
                baseItemId: row.baseItemId
            },
            create: {
                id: row.id,
                name: row.name,
                quantity: row.quantity,
                characterId: row.characterId,
                baseItemId: row.baseItemId
            }
        });
    }
    console.log(`Migrated ${rows.length} character items`);
}

async function migrateCharacterItemProperties(connection) {
    console.log('Migrating character item properties...');
    const [rows] = await connection.execute(`
        SELECT id, characterItemId, propertyId
        FROM CharacterItemProperty
    `);

    for (const row of rows) {
        await prisma.characterItemProperty.upsert({
            where: { id: row.id },
            update: {
                characterItemId: row.characterItemId,
                propertyId: row.propertyId
            },
            create: {
                id: row.id,
                characterItemId: row.characterItemId,
                propertyId: row.propertyId
            }
        });
    }
    console.log(`Migrated ${rows.length} character item properties`);
}

// =================
// Character Advancement Migrations
// =================

async function migrateCharacterAdvancements(connection) {
    console.log('Migrating character advancements...');
    const [rows] = await connection.execute(`
        SELECT id, characterId, level, version, classId, secondaryClassId,
               hitPoints, attributeId, notes, createdAt
        FROM CharacterAdvancement
    `);

    for (const row of rows) {
        await prisma.characterAdvancement.upsert({
            where: { id: row.id },
            update: {
                characterId: row.characterId,
                level: row.level,
                version: row.version,
                classId: row.classId,
                secondaryClassId: row.secondaryClassId,
                hitPoints: row.hitPoints,
                attributeId: row.attributeId,
                notes: row.notes,
                createdAt: new Date(row.createdAt)
            },
            create: {
                id: row.id,
                characterId: row.characterId,
                level: row.level,
                version: row.version,
                classId: row.classId,
                secondaryClassId: row.secondaryClassId,
                hitPoints: row.hitPoints,
                attributeId: row.attributeId,
                notes: row.notes,
                createdAt: new Date(row.createdAt)
            }
        });
    }
    console.log(`Migrated ${rows.length} character advancements`);
}

async function migrateAdvancementClassFeatures(connection) {
    console.log('Migrating advancement class features...');
    const [rows] = await connection.execute(`
        SELECT advancementId, featureSlug, choice, notes
        FROM AdvancementClassFeature
    `);

    for (const row of rows) {
        // Get the feature ID from the slug
        const feature = await prisma.feature.findUnique({
            where: { slug: row.featureSlug }
        });

        if (feature) {
            await prisma.advancementClassFeature.upsert({
                where: {
                    advancementId_featureId: {
                        advancementId: row.advancementId,
                        featureId: feature.id
                    }
                },
                update: {
                    advancementId: row.advancementId,
                    featureId: feature.id,
                    notes: row.notes
                },
                create: {
                    advancementId: row.advancementId,
                    featureId: feature.id,
                    notes: row.notes
                }
            });
        } else {
            console.log(`Warning: Feature with slug '${row.featureSlug}' not found for advancement ${row.advancementId}`);
        }
    }
    console.log(`Migrated ${rows.length} advancement class features`);
}

async function migrateAdvancementFeats(connection) {
    console.log('Migrating advancement feats...');
    const [rows] = await connection.execute(`
        SELECT advancementId, featId
        FROM AdvancementFeat
    `);

    for (const row of rows) {
        await prisma.advancementFeat.upsert({
            where: {
                advancementId_featId: {
                    advancementId: row.advancementId,
                    featId: row.featId
                }
            },
            update: {
                advancementId: row.advancementId,
                featId: row.featId
            },
            create: {
                advancementId: row.advancementId,
                featId: row.featId
            }
        });
    }
    console.log(`Migrated ${rows.length} advancement feats`);
}

async function migrateAdvancementSkills(connection) {
    console.log('Migrating advancement skills...');
    const [rows] = await connection.execute(`
        SELECT advancementId, skillId, pointsSpent
        FROM AdvancementSkill
    `);

    for (const row of rows) {
        await prisma.advancementSkill.upsert({
            where: {
                advancementId_skillId: {
                    advancementId: row.advancementId,
                    skillId: row.skillId
                }
            },
            update: {
                advancementId: row.advancementId,
                skillId: row.skillId,
                pointsSpent: row.pointsSpent
            },
            create: {
                advancementId: row.advancementId,
                skillId: row.skillId,
                pointsSpent: row.pointsSpent
            }
        });
    }
    console.log(`Migrated ${rows.length} advancement skills`);
}

async function migrateAdvancementSpells(connection) {
    console.log('Migrating advancement spells...');
    const [rows] = await connection.execute(`
        SELECT advancementId, spellId
        FROM AdvancementSpell
    `);

    for (const row of rows) {
        await prisma.advancementSpell.upsert({
            where: {
                advancementId_spellId: {
                    advancementId: row.advancementId,
                    spellId: row.spellId
                }
            },
            update: {
                advancementId: row.advancementId,
                spellId: row.spellId
            },
            create: {
                advancementId: row.advancementId,
                spellId: row.spellId
            }
        });
    }
    console.log(`Migrated ${rows.length} advancement spells`);
}

async function _migrateCharacterFeatureChoices(connection) {
    console.log('Migrating character feature choices...');
    const [rows] = await connection.execute(`
        SELECT id, characterId, featureId, advancementId, \`key\`, value
        FROM CharacterFeatureChoice
    `);

    for (const row of rows) {
        await prisma.characterFeatureChoice.upsert({
            where: { id: row.id },
            update: row,
            create: row
        });
    }
    console.log(`Migrated ${rows.length} character feature choices`);
}

// =================
// Spell Preparation Migrations
// =================

async function migrateCharacterSpellPreparations(connection) {
    console.log('Migrating character spell preparations...');
    const [rows] = await connection.execute(`
        SELECT characterId, classId, spellId, spellLevel, quantity, prepKey, slotType
        FROM CharacterSpellPreparation
    `);

    for (const row of rows) {
        await prisma.characterSpellPreparation.upsert({
            where: {
                characterId_prepKey: {
                    characterId: row.characterId,
                    prepKey: row.prepKey
                }
            },
            update: {
                characterId: row.characterId,
                classId: row.classId,
                spellId: row.spellId,
                spellLevel: row.spellLevel,
                quantity: row.quantity,
                prepKey: row.prepKey,
                slotType: row.slotType
            },
            create: {
                characterId: row.characterId,
                classId: row.classId,
                spellId: row.spellId,
                spellLevel: row.spellLevel,
                quantity: row.quantity,
                prepKey: row.prepKey,
                slotType: row.slotType
            }
        });
    }
    console.log(`Migrated ${rows.length} character spell preparations`);
}

async function migrateSpellPreparationMetamagics(connection) {
    console.log('Migrating spell preparation metamagics...');
    const [rows] = await connection.execute(`
        SELECT characterId, prepKey, featId
        FROM SpellPreparationMetamagic
    `);

    for (const row of rows) {
        await prisma.spellPreparationMetamagic.upsert({
            where: {
                characterId_prepKey_featId: {
                    characterId: row.characterId,
                    prepKey: row.prepKey,
                    featId: row.featId
                }
            },
            update: {
                characterId: row.characterId,
                prepKey: row.prepKey,
                featId: row.featId
            },
            create: {
                characterId: row.characterId,
                prepKey: row.prepKey,
                featId: row.featId
            }
        });
    }
    console.log(`Migrated ${rows.length} spell preparation metamagics`);
}

// =================
// Dice Configuration Migrations
// =================

async function migrateDiceBoxAdminConfigs(connection) {
    console.log('Migrating dice box admin configs...');
    const [rows] = await connection.execute(`
        SELECT id, gravity, mass, friction, restitution, angularDamping, linearDamping,
               spinForce, throwForce, startingHeight, settleTimeout, lightIntensity,
               enableShadows, shadowTransparency, theme, themeColor, scale,
               createdAt, updatedAt, name, iconColor, isDefault
        FROM DiceBoxAdminConfig
    `);

    for (const row of rows) {
        await prisma.diceBoxAdminConfig.upsert({
            where: { id: row.id },
            update: {
                gravity: row.gravity,
                mass: row.mass,
                friction: row.friction,
                restitution: row.restitution,
                angularDamping: row.angularDamping,
                linearDamping: row.linearDamping,
                spinForce: row.spinForce,
                throwForce: row.throwForce,
                startingHeight: row.startingHeight,
                settleTimeout: row.settleTimeout,
                lightIntensity: row.lightIntensity,
                enableShadows: Boolean(row.enableShadows),
                shadowTransparency: row.shadowTransparency,
                theme: row.theme,
                themeColor: row.themeColor,
                scale: row.scale,
                createdAt: new Date(row.createdAt),
                updatedAt: new Date(row.updatedAt),
                name: row.name,
                iconColor: row.iconColor,
                isDefault: Boolean(row.isDefault)
            },
            create: {
                id: row.id,
                gravity: row.gravity,
                mass: row.mass,
                friction: row.friction,
                restitution: row.restitution,
                angularDamping: row.angularDamping,
                linearDamping: row.linearDamping,
                spinForce: row.spinForce,
                throwForce: row.throwForce,
                startingHeight: row.startingHeight,
                settleTimeout: row.settleTimeout,
                lightIntensity: row.lightIntensity,
                enableShadows: Boolean(row.enableShadows),
                shadowTransparency: row.shadowTransparency,
                theme: row.theme,
                themeColor: row.themeColor,
                scale: row.scale,
                createdAt: new Date(row.createdAt),
                updatedAt: new Date(row.updatedAt),
                name: row.name,
                iconColor: row.iconColor,
                isDefault: Boolean(row.isDefault)
            }
        });
    }
    console.log(`Migrated ${rows.length} dice box admin configs`);
}

async function migrateUserDiceConfigOverrides(connection) {
    console.log('Migrating user dice config overrides...');
    const [rows] = await connection.execute(`
        SELECT id, userId, propertyName, propertyValue
        FROM UserDiceConfigOverride
    `);

    for (const row of rows) {
        await prisma.userDiceConfigOverride.upsert({
            where: { id: row.id },
            update: {
                userId: row.userId,
                propertyName: row.propertyName,
                propertyValue: row.propertyValue
            },
            create: {
                id: row.id,
                userId: row.userId,
                propertyName: row.propertyName,
                propertyValue: row.propertyValue
            }
        });
    }
    console.log(`Migrated ${rows.length} user dice config overrides`);
}

// Main migration function
async function migrateData() {
    let connection;

    try {
        console.log('Starting data migration...');

        // Connect to old database
        connection = await connectToOldDatabase();

        // Create migration log table
        await createMigrationLogTable();

        // Run migrations with retry logic
        await runMigrationWithRetry(connection);

        console.log('Data migration completed successfully!');

        // Clean up migration log table after successful migration
        await cleanupMigrationLogTable();

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
        await prisma.$disconnect();
    }
}

// Make all migration functions available globally
global.migrateSourceBooks = migrateSourceBooks;
global.migrateItemTypes = migrateItemTypes;
global.migrateItems = migrateItems;
global.migrateItemProperties = migrateItemProperties;
global.migrateItemPropertyAppliesTo = migrateItemPropertyAppliesTo;
global.migrateItemPropertyIncompatibilities = migrateItemPropertyIncompatibilities;
global.migrateItemTemplates = migrateItemTemplates;
global.migrateItemTemplateProperties = migrateItemTemplateProperties;
global.migrateClasses = migrateClasses;
global.migrateFeatures = migrateFeatures;
global.migrateFeatureProgressions = migrateFeatureProgressions;
global.migrateFeatureModifiers = migrateFeatureModifiers;
global.migrateFeatureSpecialEffects = migrateFeatureSpecialEffects;
global.migrateFeatureChoices = migrateFeatureChoices;
global.migrateLegacyDataFeatures = migrateLegacyDataFeatures;
global.migrateSkills = migrateSkills;
global.migrateClassSourceMap = migrateClassSourceMap;
global.migrateSpells = migrateSpells;
global.migrateSpellLevelMap = migrateSpellLevelMap;
global.migrateSpellDescriptorMap = migrateSpellDescriptorMap;
global.migrateSpellSchoolMap = migrateSpellSchoolMap;
global.migrateSpellSourceMap = migrateSpellSourceMap;
global.migrateSpellSubschoolMap = migrateSpellSubschoolMap;
global.migrateSpellComponentMap = migrateSpellComponentMap;
global.migrateFeats = migrateFeats;
global.migrateFeatBenefitMap = migrateFeatBenefitMap;
global.migrateFeatPrerequisiteMap = migrateFeatPrerequisiteMap;
global.migrateRaces = migrateRaces;
global.migrateRaceSourceMap = migrateRaceSourceMap;
global.migrateArmor = migrateArmor;
global.migrateWeapons = migrateWeapons;
global.migrateReferenceTables = migrateReferenceTables;
global.migrateReferenceTableColumns = migrateReferenceTableColumns;
global.migrateReferenceTableRows = migrateReferenceTableRows;
global.migrateReferenceTableCells = migrateReferenceTableCells;
global.migrateDiceBoxAdminConfigs = migrateDiceBoxAdminConfigs;
global.migrateUserDiceConfigOverrides = migrateUserDiceConfigOverrides;
global.migrateUsers = migrateUsers;
global.migrateUserCharacters = migrateUserCharacters;
global.migrateUserCharacterAttributes = migrateUserCharacterAttributes;
global.migrateCharacterItems = migrateCharacterItems;
global.migrateCharacterItemProperties = migrateCharacterItemProperties;
global.migrateCharacterAdvancements = migrateCharacterAdvancements;
global.migrateAdvancementClassFeatures = migrateAdvancementClassFeatures;
global.migrateAdvancementFeats = migrateAdvancementFeats;
global.migrateAdvancementSkills = migrateAdvancementSkills;
global.migrateAdvancementSpells = migrateAdvancementSpells;
// global.migrateCharacterFeatureChoices = migrateCharacterFeatureChoices;
global.migrateCharacterSpellPreparations = migrateCharacterSpellPreparations;
global.migrateSpellPreparationMetamagics = migrateSpellPreparationMetamagics;

// Command line argument handling
async function handleCommandLineArgs() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'status':
            console.log('📊 Checking migration status...');
            await createMigrationLogTable();
            await showMigrationStatus();
            break;

        case 'reset-failed':
            console.log('🔄 Resetting failed migrations...');
            await createMigrationLogTable();
            await resetFailedMigrations();
            await cleanupMigrationLogTable();
            console.log('✅ Failed migrations reset. You can now re-run the migration.');
            break;

        case 'reset-all':
            console.log('🔄 Resetting all migrations...');
            await createMigrationLogTable();
            await resetAllMigrations();
            await cleanupMigrationLogTable();
            console.log('✅ All migrations reset. You can now re-run the migration from scratch.');
            break;

        case 'migrate':
        case undefined:
            console.log('🚀 Starting full migration...');
            await migrateData();
            break;

        default:
            console.log(`
Usage: node migrate-data.js [command]

Commands:
  migrate        Run the full migration (default)
  status         Show current migration status
  reset-failed   Reset only failed migrations for retry
  reset-all      Reset all migrations to start fresh

Examples:
  node migrate-data.js              # Run full migration
  node migrate-data.js status       # Check status
  node migrate-data.js reset-failed # Reset failed steps
  node migrate-data.js reset-all    # Start completely fresh
            `);
            break;
    }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    handleCommandLineArgs()
        .then(() => {
            console.log('Operation completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Operation failed:', error);
            process.exit(1);
        });
}

export { migrateData };

// Mapping functions for converting old aspect strings to enum values
function mapAspectToModifierType(aspect) {
    const modifierTypeMap = {
        'skill_points': 8,        // SkillBonus
        'bonus': 0,               // FlatBonus
        'damage_die': 1,          // DamageDice
        'damageDie': 1,           // DamageDice (camelCase variant)
        'movement_speed': 2,      // MovementSpeed
        'distance': 3,            // Distance
        'energy_resistance': 4,   // EnergyResistance
        'ac': 5,                  // AC
        'dr': 6,                  // DR
        'save_bonus': 7,          // SaveBonus
        'attack_bonus': 9,        // AttackBonus
        'spell_dc': 10,           // SpellDC
        'uses_per_day': 11,       // UsesPerDay
        'usesPerDay': 11,         // UsesPerDay (camelCase variant)
        'uses_per_week': 11,      // UsesPerDay (treating week as day)
        'usesPerWeek': 11,        // UsesPerDay (camelCase variant, treating week as day)
        'damage_reduction': 6,    // DR
        'damageReduction': 6,     // DR (camelCase variant)
        'secondary_uses_per_day': 11, // UsesPerDay
        'secondaryUsesPerDay': 11,    // UsesPerDay (camelCase variant)
        'bonusFeat': 12,          // Other (handled specially)
        'nth_feature': 12,        // Other
    };

    if (!(aspect in modifierTypeMap)) {
        console.error(`❌ CRITICAL ERROR: Unmapped aspect '${aspect}' encountered during migration.`);
        console.error(`   Migration aborted to prevent data loss.`);
        console.error(`   Please update the mapping function and re-run the migration.`);
        process.exit(1);
    }

    return modifierTypeMap[aspect];
}

function mapAspectToEffectType(aspect) {
    const effectTypeMap = {
        'favored_enemy': 0,       // FavoredEnemy
        'turn_undead': 2,         // TurnUndead
        'wild_shape_form': 3,     // WildShapeForm
        'wild_shape_size': 4,     // WildShapeSize
        'form': 3,                // WildShapeForm
        'size': 4,                // WildShapeSize
    };

    if (!(aspect in effectTypeMap)) {
        console.error(`❌ CRITICAL ERROR: Unmapped aspect '${aspect}' encountered during migration.`);
        console.error(`   Migration aborted to prevent data loss.`);
        console.error(`   Please update the mapping function and re-run the migration.`);
        process.exit(1);
    }

    return effectTypeMap[aspect];
}
