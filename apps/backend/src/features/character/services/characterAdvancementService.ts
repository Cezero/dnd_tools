import { prisma } from '@/lib/prisma';
import type {
    CreateAdvancementRequest,
    UpdateAdvancementRequest,
    CharacterAdvancementWithDetailsResponse,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';
import { EntityAppliesToType, EntityType } from '@shared/static-data';


/**
 * Service for managing character advancements.
 * 
 * Handles CRUD operations for character advancements including skills,
 * feats, feature choices, and spellbook class auto-grant logic.
 */
export const characterAdvancementService = {
    async createAdvancement(data: CreateAdvancementRequest): Promise<CreateResponse> {
        const { skills, feats, featureChoices, ...advancementData } = data;

        const result = await prisma.characterAdvancement.create({
            data: {
                ...advancementData,
                version: 1, // Default version for new advancements
                skills: skills ? {
                    create: skills
                } : undefined,
                feats: feats ? {
                    create: feats
                } : undefined,
                featureChoices: featureChoices ? {
                    create: featureChoices.map(choice => ({
                        ...choice,
                        characterId: advancementData.characterId,
                        advancementId: 0, // Will be set after creation
                    }))
                } : undefined,
            },
        });

        // Update featureChoices with the correct advancementId if they were created
        if (featureChoices && featureChoices.length > 0) {
            await prisma.characterFeatureChoice.updateMany({
                where: {
                    characterId: advancementData.characterId,
                    advancementId: 0,
                    featureId: { in: featureChoices.map(c => c.featureId) }
                },
                data: {
                    advancementId: result.id
                }
            });
        }

        // Auto-grant 0th level spells for spellbook classes on first level
        // Check if this class is a spellbook class by checking for FeatureWithRelations with SpellbookSpell entity
        // Check if class has spellbook spell feature via many-to-many relationship
        const classLinks = await prisma.featureClassMap.findMany({
            where: { classId: advancementData.classId },
            select: { featureId: true }
        });
        const progressionIds = classLinks.map(link => link.featureId);

        const isSpellbookClass = await prisma.featureEntity.findFirst({
            where: {
                feature: {
                    id: { in: progressionIds },
                    level: { lte: advancementData.level }
                },
                type: EntityType.Other,
                appliesTo: EntityAppliesToType.SpellbookSpell
            }
        });

        return { id: result.id.toString(), message: 'Character advancement created successfully' };
    },

    async updateAdvancement(id: number, data: UpdateAdvancementRequest): Promise<UpdateResponse> {
        const { skills, feats, featureChoices, ...advancementData } = data;

        // Handle nested updates: delete existing and create new
        await prisma.$transaction(async (tx) => {
            // Get the advancement to get characterId
            const advancement = await tx.characterAdvancement.findUnique({
                where: { id },
                select: { characterId: true }
            });

            if (!advancement) {
                throw new Error(`Advancement with id ${id} not found`);
            }

            // Update the advancement itself
            await tx.characterAdvancement.update({
                where: { id },
                data: advancementData,
            });

            // Handle skills: delete existing and create new if provided
            if (skills !== undefined) {
                await tx.advancementSkill.deleteMany({
                    where: { advancementId: id },
                });
                if (skills.length > 0) {
                    await tx.advancementSkill.createMany({
                        data: skills.map(skill => ({
                            ...skill,
                            advancementId: id,
                        })),
                    });
                }
            }

            // Handle feats: delete existing and create new if provided
            if (feats !== undefined) {
                await tx.advancementFeat.deleteMany({
                    where: { advancementId: id },
                });
                if (feats.length > 0) {
                    await tx.advancementFeat.createMany({
                        data: feats.map(feat => ({
                            ...feat,
                            advancementId: id,
                        })),
                    });
                }
            }

            // Handle featureChoices: delete existing and create new if provided
            if (featureChoices !== undefined) {
                await tx.characterFeatureChoice.deleteMany({
                    where: { advancementId: id },
                });
                if (featureChoices.length > 0) {
                    await tx.characterFeatureChoice.createMany({
                        data: featureChoices.map(choice => ({
                            ...choice,
                            characterId: advancement.characterId,
                            advancementId: id,
                        })),
                    });
                }
            }
        });

        return { message: 'Character advancement updated successfully' };
    },

    async deleteAdvancement(id: number): Promise<UpdateResponse> {
        await prisma.characterAdvancement.delete({
            where: { id },
        });

        return { message: 'Character advancement deleted successfully' };
    },

    async getAdvancementById(id: number): Promise<CharacterAdvancementWithDetailsResponse | null> {
        const advancement = await prisma.characterAdvancement.findUnique({
            where: { id },
            include: {
                skills: true,
                feats: true,
                spellsKnown: true,
                featureChoices: true,
            },
        });

        return advancement as CharacterAdvancementWithDetailsResponse;
    },

    async getCharacterAdvancements(characterId: number): Promise<CharacterAdvancementWithDetailsResponse[]> {
        const advancements = await prisma.characterAdvancement.findMany({
            where: { characterId },
            include: {
                skills: true,
                feats: true,
                spellsKnown: true,
                featureChoices: true,
            },
            orderBy: { level: 'asc' },
        });

        return advancements as CharacterAdvancementWithDetailsResponse[];
    },
};
