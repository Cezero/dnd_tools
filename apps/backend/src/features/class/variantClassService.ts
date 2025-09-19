import { PrismaClient } from '@shared/prisma-client';
import {
    ClassVariant,
    CreateClassVariantRequest,
    UpdateClassVariantRequest,
    DnDClass,
    CreateResponse,
    UpdateResponse,
    ClassVariantFeatureProgressionOverride,
    FeatureProgression,
} from '@shared/schema';
import { calculateVariantId, ProgressionType } from '@shared/static-data';
import { applyFeatureProgressionOverrides } from '@shared/utils';

import { classService } from './classService.js';
import { featureSystemService } from '../featureSystem/featureSystemService.js';
import type { FeatureProgressionContext } from '../featureSystem/types.js';

export class VariantClassService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Resolve a class with variant applied by custom variant ID
     */
    async resolveClassWithVariantById(customVariantId: number): Promise<DnDClass> {
        // Get variant by its custom ID (without baseClass include)
        const variant = await this.prisma.classVariant.findUnique({
            where: { id: customVariantId },
            include: {
                featureProgressionOverrides: {
                    include: {
                        replacementFeatureProgression: true,
                        removeEntities: true,
                    },
                },
                sourceBookInfo: true,
            },
        });

        if (!variant) {
            throw new Error(`Variant with ID ${customVariantId} not found`);
        }

        // Get the base class using the classService
        const baseClass = await classService.getClassById({ id: variant.baseClassId });
        if (!baseClass) {
            throw new Error(`Base class with ID ${variant.baseClassId} not found`);
        }

        // Fetch replacement feature progressions using the feature system service for proper population
        const enrichedOverrides = await Promise.all(
            variant.featureProgressionOverrides.map(async (override) => {
                if (override.replacementFeatureProgression && override.replacementFeatureProgression.length > 0) {
                    // Get the IDs of the replacement progressions
                    const progressionIds = override.replacementFeatureProgression.map(p => p.id);
                    // Fetch them using the feature system service for proper population
                    const enrichedProgressions: FeatureProgression[] = await featureSystemService.getFeatureProgressionsByIds(progressionIds);

                    return {
                        ...override,
                        replacementFeatureProgression: enrichedProgressions
                    };
                }
                return override;
            })
        );

        // Apply variant overrides to base class
        // Start with base class features
        let processedFeatures = [...(baseClass.features || [])];

        // Apply feature overrides if they exist
        if (enrichedOverrides && enrichedOverrides.length > 0) {
            processedFeatures = applyFeatureProgressionOverrides(processedFeatures, enrichedOverrides as ClassVariantFeatureProgressionOverride[]);
        }

        // Create resolved class with variant overrides applied
        const resolvedClass: DnDClass = {
            ...baseClass,
            name: variant.name,
            abbreviation: variant.abbreviation,
            hitDie: variant.hitDie ?? baseClass.hitDie,
            skillPoints: variant.skillPoints ?? baseClass.skillPoints,
            babProgression: (variant.babProgression ?? baseClass.babProgression) as ProgressionType,
            fortProgression: (variant.fortProgression ?? baseClass.fortProgression) as ProgressionType,
            refProgression: (variant.refProgression ?? baseClass.refProgression) as ProgressionType,
            willProgression: (variant.willProgression ?? baseClass.willProgression) as ProgressionType,
            description: variant.description || baseClass.description,
            sourceBookInfo: variant.sourceBookInfo || baseClass.sourceBookInfo,
            features: processedFeatures,
        };

        return resolvedClass;
    }


    /**
     * Create a new class variant
     */
    async createVariant(data: CreateClassVariantRequest): Promise<CreateResponse> {
        // Validate base class exists
        const baseClass = await this.prisma.class.findUnique({
            where: { id: data.baseClassId },
        });

        if (!baseClass) {
            throw new Error(`Base class with ID ${data.baseClassId} not found`);
        }

        // Check for duplicate variant name for this base class
        const existingVariant = await this.prisma.classVariant.findUnique({
            where: {
                name_baseClassId: {
                    name: data.name,
                    baseClassId: data.baseClassId,
                },
            },
        });

        if (existingVariant) {
            throw new Error(`Variant "${data.name}" already exists for this base class`);
        }

        // Get the next available variant ID for this base class
        const existingVariants = await this.prisma.classVariant.findMany({
            where: { baseClassId: data.baseClassId },
            select: { id: true },
        });

        // Find the next available variant ID (starting from 1)
        let nextVariantId = 1;
        const existingVariantIds = existingVariants.map(v => v.id % 100000);
        while (existingVariantIds.includes(nextVariantId)) {
            nextVariantId++;
        }

        // Calculate custom ID
        const customId = calculateVariantId(data.baseClassId, nextVariantId);

        // Create variant with related data using transaction
        const variant = await this.prisma.$transaction(async (tx) => {
            // Destructure complex objects from data, leaving simple fields for spread
            const { featureProgressionOverrides, spellOverrides, ...variantData } = data;

            // Create the variant first using spread operator
            const variantResult = await tx.classVariant.create({
                data: {
                    id: customId,
                    ...variantData,
                    sourceBookInfo: data.sourceBookInfo ? {
                        create: data.sourceBookInfo
                    } : undefined,
                },
            });

            // Create feature progression overrides
            if (featureProgressionOverrides && featureProgressionOverrides.length > 0) {
                for (const override of featureProgressionOverrides) {
                    // Create the override
                    const overrideResult = await tx.classVariantFeatureProgressionOverride.create({
                        data: {
                            variantId: variantResult.id,
                            originalFeatureProgressionId: override.originalFeatureProgressionId,
                        },
                    });

                    // Create remove entities mapping
                    if (override.removeEntities && override.removeEntities.length > 0) {
                        await tx.classVariantFeatureProgressionRemoveEntityMap.createMany({
                            data: override.removeEntities.map(entity => ({
                                classVariantFeatureProgressionOverrideId: overrideResult.id,
                                featureEntityId: entity.featureEntityId,
                            })),
                        });
                    }

                    // Create replacement feature progressions using feature system service
                    if (override.replacementFeatureProgression && override.replacementFeatureProgression.length > 0) {
                        const context: FeatureProgressionContext = { variantOverrideId: overrideResult.id };
                        await featureSystemService.createMultipleFeatureProgressions(
                            override.replacementFeatureProgression,
                            context,
                            tx
                        );
                    }
                }
            }

            // Create spell overrides
            if (spellOverrides && spellOverrides.length > 0) {
                await tx.classVariantSpellOverride.createMany({
                    data: spellOverrides.map(override => ({
                        ...override,
                        variantId: variantResult.id,
                    })),
                });
            }

            return variantResult;
        });

        return { id: variant.id.toString(), message: 'Class variant created successfully' };
    }

    /**
     * Update an existing class variant
     */
    async updateVariant(variantId: number, data: UpdateClassVariantRequest): Promise<UpdateResponse> {
        const existingVariant = await this.prisma.classVariant.findUnique({
            where: { id: variantId },
        });

        if (!existingVariant) {
            throw new Error(`Variant with ID ${variantId} not found`);
        }

        // Check for duplicate variant name if name is being updated
        if (data.name && data.name !== existingVariant.name) {
            const duplicateVariant = await this.prisma.classVariant.findUnique({
                where: {
                    name_baseClassId: {
                        name: data.name,
                        baseClassId: existingVariant.baseClassId,
                    },
                },
            });

            if (duplicateVariant) {
                throw new Error(`Variant "${data.name}" already exists for this base class`);
            }
        }

        // Update variant with feature overrides and spell additions using transaction
        await this.prisma.$transaction(async (tx) => {
            // Destructure complex objects from data, leaving simple fields for spread
            const { featureProgressionOverrides, spellOverrides, baseClassId: _baseClassId, sourceBookInfo, ...variantData } = data;

            // Update the variant basic fields using spread operator
            const variantResult = await tx.classVariant.update({
                where: { id: variantId },
                data: variantData,
            });

            // Delete existing feature progression overrides and recreate them
            if (featureProgressionOverrides !== undefined) {
                // First, get existing override IDs to delete their associated feature progressions
                const existingOverrides = await tx.classVariantFeatureProgressionOverride.findMany({
                    where: { variantId: variantId },
                    select: { id: true }
                });

                // Delete feature progressions associated with each override using feature system service
                for (const override of existingOverrides) {
                    const deleteContext: FeatureProgressionContext = { variantOverrideId: override.id };
                    await featureSystemService.deleteFeatureProgressionsForContext(deleteContext, tx);
                }

                // Delete remove entity mappings
                await tx.classVariantFeatureProgressionRemoveEntityMap.deleteMany({
                    where: {
                        classVariantFeatureProgressionOverride: {
                            variantId: variantId
                        }
                    }
                });

                // Then delete the overrides themselves
                await tx.classVariantFeatureProgressionOverride.deleteMany({
                    where: { variantId: variantId },
                });

                // Create new feature progression overrides
                if (featureProgressionOverrides) {
                    for (const override of featureProgressionOverrides) {
                        // Create the override
                        const overrideResult = await tx.classVariantFeatureProgressionOverride.create({
                            data: {
                                variantId: variantResult.id,
                                originalFeatureProgressionId: override.originalFeatureProgressionId,
                            },
                        });

                        // Create remove entities mapping
                        if (override.removeEntities && override.removeEntities.length > 0) {
                            await tx.classVariantFeatureProgressionRemoveEntityMap.createMany({
                                data: override.removeEntities.map(entity => ({
                                    classVariantFeatureProgressionOverrideId: overrideResult.id,
                                    featureEntityId: entity.featureEntityId,
                                })),
                            });
                        }

                        // Create replacement feature progressions using feature system service
                        if (override.replacementFeatureProgression && override.replacementFeatureProgression.length > 0) {
                            const context: FeatureProgressionContext = { variantOverrideId: overrideResult.id };
                            await featureSystemService.createMultipleFeatureProgressions(
                                override.replacementFeatureProgression,
                                context,
                                tx
                            );
                        }
                    }
                }
            }

            // Delete existing spell overrides and recreate them
            if (spellOverrides !== undefined) {
                await tx.classVariantSpellOverride.deleteMany({
                    where: { variantId: variantId },
                });

                if (spellOverrides && spellOverrides.length > 0) {
                    await tx.classVariantSpellOverride.createMany({
                        data: spellOverrides.map(override => ({
                            ...override,
                            variantId: variantResult.id,
                        })),
                    });
                }
            }

            // Delete existing source book info and recreate it
            if (sourceBookInfo !== undefined) {
                await tx.classVariantSourceMap.deleteMany({
                    where: { variantId: variantId },
                });

                if (sourceBookInfo && sourceBookInfo.length > 0) {
                    await tx.classVariantSourceMap.createMany({
                        data: sourceBookInfo.map(sourceInfo => ({
                            ...sourceInfo,
                            variantId: variantResult.id,
                        })),
                    });
                }
            }

            return variantResult;
        });

        return { message: 'Class variant updated successfully' };
    }

    /**
     * Delete a class variant
     */
    async deleteVariant(variantId: number): Promise<UpdateResponse> {
        await this.prisma.classVariant.delete({
            where: { id: variantId },
        });

        return { message: 'Class variant deleted successfully' };
    }

    /**
     * Get a variant by ID
     */
    async getVariant(variantId: number): Promise<ClassVariant | null> {
        const result = await this.prisma.classVariant.findUnique({
            where: { id: variantId },
            include: {
                baseClass: true,
                featureProgressionOverrides: {
                    include: {
                        replacementFeatureProgression: true,
                        removeEntities: true,
                    },
                },
                spellOverrides: {
                    include: {
                        spell: true,
                    },
                },
                sourceBookInfo: true,
            },
        });

        if (!result) {
            return null;
        }

        // Fetch replacement feature progressions using the feature system service for proper population
        const enrichedOverrides = await Promise.all(
            result.featureProgressionOverrides.map(async (override) => {
                if (override.replacementFeatureProgression && override.replacementFeatureProgression.length > 0) {
                    // Get the IDs of the replacement progressions
                    const progressionIds = override.replacementFeatureProgression.map(p => p.id);
                    // Fetch them using the feature system service for proper population
                    const enrichedProgressions = await featureSystemService.getFeatureProgressionsByIds(progressionIds);

                    return {
                        ...override,
                        replacementFeatureProgression: enrichedProgressions
                    };
                }
                return override;
            })
        );

        return {
            ...result,
            featureProgressionOverrides: enrichedOverrides
        } as ClassVariant;
    }
}
