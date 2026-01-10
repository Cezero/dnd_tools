import { fileURLToPath } from 'url';

import { PrismaClient } from '@shared/prisma-client';
import { SpecialFeatureId, FeatureSourceType, EntityType, EntityAppliesToType } from '@shared/static-data';

const __filename = fileURLToPath(import.meta.url);

const prisma = new PrismaClient();

interface MigrationReport {
    companionsProcessed: number;
    progressionsCreated: number;
    entitiesCreated: number;
    conditionsCreated: number;
    errors: string[];
}

/**
 * Migration script to convert CompanionBenefitMap records to FeatureProgression/FeatureEntity system
 * 
 * This script:
 * 1. Finds all Companions with CompanionBenefitMap records
 * 2. Creates one FeatureProgression per companion with SpecialFeatureId.CompanionBenefit
 * 3. Converts each CompanionBenefitMap to a FeatureEntity
 * 4. Converts each CompanionBenefitCondition to a FeatureEntityCondition
 * 5. Validates the migration
 * 
 * Run this script BEFORE dropping the CompanionBenefitMap and CompanionBenefitCondition tables.
 */
async function migrateCompanionBenefits(): Promise<MigrationReport> {
    const report: MigrationReport = {
        companionsProcessed: 0,
        progressionsCreated: 0,
        entitiesCreated: 0,
        conditionsCreated: 0,
        errors: [],
    };

    try {
        console.log('Starting Companion Benefit migration...');

        // Ensure the CompanionBenefit feature exists
        let companionBenefitFeature = await prisma.feature.findUnique({
            where: { id: SpecialFeatureId.CompanionBenefit },
        });

        if (!companionBenefitFeature) {
            console.log('Creating CompanionBenefit feature...');
            companionBenefitFeature = await prisma.feature.create({
                data: {
                    id: SpecialFeatureId.CompanionBenefit,
                    slug: 'companion-benefit',
                    name: 'Companion Benefits',
                    description: 'Benefits granted by companions',
                    displayInCharacterSheet: true,
                },
            });
            console.log('CompanionBenefit feature created');
        }

        // Get all companions with benefits
        const companionsWithBenefits = await prisma.companion.findMany({
            include: {
                benefits: {
                    include: {
                        conditions: true,
                    },
                    orderBy: {
                        index: 'asc',
                    },
                },
            },
            where: {
                benefits: {
                    some: {},
                },
            },
        });

        console.log(`Found ${companionsWithBenefits.length} companions with benefits`);

        // Process each companion
        for (const companion of companionsWithBenefits) {
            try {
                if (companion.benefits.length === 0) {
                    continue;
                }

                // Create FeatureProgression for this companion
                const progression = await prisma.featureProgression.create({
                    data: {
                        featureId: SpecialFeatureId.CompanionBenefit,
                        sourceType: FeatureSourceType.Companion,
                        companionId: companion.id,
                        level: 1,
                        classId: null,
                        raceId: null,
                        variantOverrideId: null,
                        domainId: null,
                        featId: null,
                    },
                });

                report.progressionsCreated++;

                // Convert each CompanionBenefitMap to FeatureEntity
                for (const benefit of companion.benefits) {
                    // Map typeId to EntityAppliesToType
                    let appliesTo: EntityAppliesToType;
                    if (benefit.typeId === 1) {
                        // Skill
                        appliesTo = EntityAppliesToType.Skill;
                    } else if (benefit.typeId === 2) {
                        // SavingThrow
                        appliesTo = EntityAppliesToType.SavingThrow;
                    } else if (benefit.typeId === 3) {
                        // HitPoints
                        appliesTo = EntityAppliesToType.HitPoints;
                    } else {
                        appliesTo = EntityAppliesToType.Other;
                    }

                    // Create FeatureEntity
                    const entity = await prisma.featureEntity.create({
                        data: {
                            progressionId: progression.id,
                            type: EntityType.Bonus,
                            appliesTo: appliesTo,
                            appliesToId: benefit.referenceId,
                            appliesToSubId: null,
                            value: benefit.amount,
                            bonusType: null,
                            formulaParamsId: null,
                            groupingId: benefit.index, // Preserve ordering
                            displayInDetail: true,
                            filterType: null,
                        },
                    });

                    report.entitiesCreated++;

                    // Convert CompanionBenefitCondition to FeatureEntityCondition
                    if (benefit.conditions && benefit.conditions.length > 0) {
                        for (const condition of benefit.conditions) {
                            await prisma.featureEntityCondition.create({
                                data: {
                                    featureEntityId: entity.id,
                                    conditionType: condition.conditionType,
                                    conditionValue: condition.conditionValue,
                                },
                            });

                            report.conditionsCreated++;
                        }
                    }
                }

                report.companionsProcessed++;
                console.log(`Migrated companion ${companion.id} (${companion.benefits.length} benefits)`);
            } catch (error) {
                const errorMsg = `Error migrating companion ${companion.id}: ${error instanceof Error ? error.message : String(error)}`;
                report.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        // Validation
        console.log('\nValidating migration...');

        const totalBenefits = await prisma.companionBenefitMap.count();
        const totalConditions = await prisma.companionBenefitCondition.count();

        const migratedEntities = await prisma.featureEntity.count({
            where: {
                featureProgression: {
                    featureId: SpecialFeatureId.CompanionBenefit,
                    sourceType: FeatureSourceType.Companion,
                },
            },
        });

        const migratedConditions = await prisma.featureEntityCondition.count({
            where: {
                featureEntity: {
                    featureProgression: {
                        featureId: SpecialFeatureId.CompanionBenefit,
                        sourceType: FeatureSourceType.Companion,
                    },
                },
            },
        });

        console.log(`\nMigration Summary:`);
        console.log(`  Companions processed: ${report.companionsProcessed}`);
        console.log(`  Progressions created: ${report.progressionsCreated}`);
        console.log(`  Entities created: ${report.entitiesCreated}`);
        console.log(`  Conditions created: ${report.conditionsCreated}`);
        console.log(`\nValidation:`);
        console.log(`  Original benefits: ${totalBenefits}`);
        console.log(`  Migrated entities: ${migratedEntities}`);
        console.log(`  Original conditions: ${totalConditions}`);
        console.log(`  Migrated conditions: ${migratedConditions}`);

        if (report.entitiesCreated !== totalBenefits) {
            report.errors.push(`Entity count mismatch: expected ${totalBenefits}, got ${report.entitiesCreated}`);
        }

        if (report.conditionsCreated !== totalConditions) {
            report.errors.push(`Condition count mismatch: expected ${totalConditions}, got ${report.conditionsCreated}`);
        }

        if (report.errors.length > 0) {
            console.error(`\nErrors encountered: ${report.errors.length}`);
            report.errors.forEach((error) => console.error(`  - ${error}`));
        } else {
            console.log('\n✓ Migration completed successfully!');
        }

        return report;
    } catch (error) {
        const errorMsg = `Fatal error during migration: ${error instanceof Error ? error.message : String(error)}`;
        report.errors.push(errorMsg);
        console.error(errorMsg);
        throw error;
    }
}

// Run migration if executed directly
if (process.argv[1] && __filename === process.argv[1]) {
    migrateCompanionBenefits()
        .then((report) => {
            if (report.errors.length > 0) {
                process.exit(1);
            } else {
                process.exit(0);
            }
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        })
        .finally(() => {
            prisma.$disconnect();
        });
}

export { migrateCompanionBenefits };
