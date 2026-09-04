import { persistCharacterCompanionAdvancements } from '@/features/companion/companionAdvancementPersist';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@shared/prisma-client';
import {
    CompanionIdParamRequest,
    CompanionCacheResponse,
    CreateCompanionRequest,
    CreateCharacterCompanionRequest,
    CreateResponse,
    GetAllCharacterCompanionsResponse,
    GetAllCompanionsResponse,
    GetCompanionResponse,
    GetResolvedCharacterCompanionsResponse,
    UpdateCharacterCompanionRequest,
    UpdateCompanionRequest,
    UpdateResponse,
} from '@shared/schema';
import { sumAdvancementHitPoints } from '@shared/static-data';

import { companionAdvancementService } from './companionAdvancementService';
import type { CompanionService } from './types';
import { featureSystemService } from '../featureSystem/featureSystemService';

/**
 * Companion Service
 * 
 * Provides comprehensive companion management capabilities including:
 * - Companion definition CRUD operations (admin-managed templates)
 * - Character companion management (user-managed instances)
 * - Feature system integration for companion benefits
 * - Trick association management for character companions
 * - Automatic HP calculation from monster data
 * 
 * The service supports dual CRUD operations:
 * - Companion definitions: Admin-managed companion templates (familiar types, animal companion types)
 * - Character companions: User-managed companion instances linked to specific characters
 * 
 * Integration Points:
 * - Feature System: Companion benefits managed through feature features
 * - Monster System: Companions link to monsters for statblock data
 * - Trick System: Character companions can learn tricks
 * - Character System: Character ownership validation in controller layer
 * 
 * @see CompanionService interface for method signatures
 * @see companionController for request handling
 * @see companionRoutes for API endpoints
 */
export const companionService: CompanionService = {
    /**
     * Retrieves all companion definitions.
     * 
     * Design Decision: Lightweight Schema Pattern
     * - Returns only monsterId, not nested monster object
     * - Frontend resolves monster names from pre-populated monsters-cache
     * - Reduces payload size and ensures consistent data resolution
     * 
     * Orders results by companion type and monster ID for consistent presentation.
     * 
     * @returns Promise resolving to GetAllCompanionsResponse with total count and results array
     * 
     * @see [Cache-Based ID Maps](../../../../shared/docs/application-overview/cache-based-id-maps.md)
     * @see [Lightweight Schema Pattern](../../../../shared/docs/application-overview/validation-schemas.md#lightweight-response-schemas)
     */
    async getAllCompanions(): Promise<GetAllCompanionsResponse> {
        const [companions, total] = await Promise.all([
            prisma.companion.findMany({
                orderBy: [
                    { type: 'asc' },
                    { monsterId: 'asc' },
                ],
            }),
            prisma.companion.count(),
        ]);

        return {
            total,
            results: companions,
        };
    },

    /**
     * Retrieves a specific companion definition by ID with complete details including feature features.
     * 
     * Design Decision: Lightweight Schema Pattern
     * - Returns only monsterId, not nested monster object
     * - Frontend resolves monster names from pre-populated monsters-cache
     * - Reduces payload size and ensures consistent data resolution
     * 
     * Integrates with feature system service to retrieve companion benefit feature features,
     * ensuring companion benefits are properly loaded. Combines companion data with feature
     * features for complete response.
     * 
     * @param query - CompanionIdParamRequest with companion ID
     * @returns Promise resolving to GetCompanionResponse with complete companion data including
     *          feature features, or null if not found
     * 
     * @see featureSystemService.getFeaturesByCompanionId for feature retrieval
     * @see [Cache-Based ID Maps](../../../../shared/docs/application-overview/cache-based-id-maps.md)
     * @see [Lightweight Schema Pattern](../../../../shared/docs/application-overview/validation-schemas.md#lightweight-response-schemas)
     */
    async getCompanionById(query: CompanionIdParamRequest): Promise<GetCompanionResponse | null> {
        const companion = await prisma.companion.findUnique({
            where: { id: query.id },
        });

        if (!companion) {
            return null;
        }

        // Get feature features using the feature system service
        const features = await featureSystemService.getFeaturesByCompanionId(query.id);

        // Combine companion data with feature features
        return {
            ...companion,
            features,
        };
    },

    async createCompanion(data: CreateCompanionRequest): Promise<CreateResponse> {
        const companion = await prisma.companion.create({
            data: data,
        });

        return { id: companion.id.toString(), message: 'Companion created successfully' };
    },

    async updateCompanion(data: UpdateCompanionRequest, query: CompanionIdParamRequest): Promise<UpdateResponse> {
        await prisma.companion.update({
            where: { id: query.id },
            data: data,
        });

        return { message: 'Companion updated successfully' };
    },

    async deleteCompanion(query: CompanionIdParamRequest): Promise<UpdateResponse> {
        await prisma.companion.delete({
            where: { id: query.id }
        });

        return { message: 'Companion deleted successfully' };
    },

    /**
     * Retrieves all character companions for a specific character.
     * 
     * Design Decision: Lightweight Schema Pattern
     * - Returns only monsterId, not nested monster object
     * - Frontend resolves monster names from pre-populated monsters-cache
     * - Reduces payload size and ensures consistent data resolution
     * 
     * @param characterId - The character ID to retrieve companions for
     * @returns Promise resolving to GetAllCharacterCompanionsResponse with total count and results array
     * 
     * @see [Cache-Based ID Maps](../../../../shared/docs/application-overview/cache-based-id-maps.md)
     * @see [Lightweight Schema Pattern](../../../../shared/docs/application-overview/validation-schemas.md#lightweight-response-schemas)
     */
    async getCharacterCompanions(characterId: number): Promise<GetAllCharacterCompanionsResponse> {
        const [companions, total] = await Promise.all([
            prisma.characterCompanion.findMany({
                where: { characterId },
                include: {
                    companion: true,
                    trickPurpose: true,
                    tricks: {
                        include: {
                            trick: true,
                        },
                    },
                    advancements: {
                        include: { skills: true, feats: true },
                        orderBy: { sequence: 'asc' },
                    },
                },
                orderBy: { levelAcquired: 'asc' },
            }),
            prisma.characterCompanion.count({ where: { characterId } }),
        ]);

        return {
            total,
            results: companions.map(companion => ({
                ...companion,
                companion: companion.companion ?? undefined,
                trickPurpose: companion.trickPurpose ?? undefined,
            })),
        };
    },

    /**
     * Resolved companions with computed stat blocks, progression, and trick/skill/feat budgets.
     */
    async getResolvedCharacterCompanions(characterId: number): Promise<GetResolvedCharacterCompanionsResponse> {
        return companionAdvancementService.getResolvedCharacterCompanions(characterId);
    },

    /**
     * Creates a new character companion with trick associations and automatic HP calculation.
     * 
     * Uses transaction to ensure atomic creation of companion and trick associations.
     * Automatically calculates hit points from monster averageHP if not provided.
     * 
     * Business Logic:
     * - Extracts tricks array from request data
     * - Calculates hit points: uses provided value, or queries monster for averageHP, or null if monster not found
     * - Creates character companion in transaction
     * - Creates trick associations if tricks array provided
     * 
     * @param data - CreateCharacterCompanionRequest with character companion data and optional tricks array
     * @returns Promise resolving to CreateResponse with created character companion ID
     * 
     * @see Monster system for averageHP lookup
     * @see Trick system for trick associations
     */
    async createCharacterCompanion(data: CreateCharacterCompanionRequest): Promise<CreateResponse> {
        const { tricks, advancements, ...companionData } = data;

        await companionAdvancementService.validateCompanionWrite({
            monsterId: companionData.monsterId,
            companionId: companionData.companionId,
            characterId: companionData.characterId,
            trickPurposeId: companionData.trickPurposeId,
            tricks,
            advancements,
        });

        const result = await prisma.$transaction(async (tx) => {
            const characterCompanion = await tx.characterCompanion.create({
                data: {
                    characterId: companionData.characterId,
                    monsterId: companionData.monsterId,
                    companionId: companionData.companionId || null,
                    trickPurposeId: companionData.trickPurposeId || null,
                    name: companionData.name || null,
                    levelAcquired: companionData.levelAcquired || null,
                    hitPoints: advancements && advancements.length > 0
                        ? sumAdvancementHitPoints(advancements)
                        : (companionData.hitPoints ?? null),
                    wounds: companionData.wounds || 0,
                    maxHpAtFirstLevel: companionData.maxHpAtFirstLevel ?? false,
                },
            });

            if (companionData.trickPurposeId) {
                await applyTrickPurpose(tx, characterCompanion.id, null, companionData.trickPurposeId);
            }

            if (tricks && tricks.length > 0) {
                await tx.characterCompanionTrick.createMany({
                    data: tricks.map((trick) => ({
                        characterCompanionId: characterCompanion.id,
                        trickId: trick.trickId,
                        timesTrained: trick.timesTrained ?? 1,
                        isBonus: trick.isBonus ?? false,
                        fromPurpose: false,
                    })),
                    skipDuplicates: true,
                });
            }

            await persistCharacterCompanionAdvancements(tx, characterCompanion.id, advancements);

            return characterCompanion;
        });

        return { id: result.id.toString(), message: 'Character companion created successfully' };
    },

    /**
     * Updates an existing character companion with trick management.
     * 
     * Uses delete/recreate pattern for trick associations to ensure data consistency.
     * Only updates tricks if tricks array is explicitly provided (undefined means no change).
     * 
     * Business Logic:
     * - Extracts tricks array from request data
     * - Updates character companion in transaction
     * - If tricks array provided (not undefined):
     *   - Deletes all existing trick associations
     *   - Creates new trick associations if array is non-empty
     * 
     * @param data - UpdateCharacterCompanionRequest with updated data and optional tricks array
     * @param query - Object with character companion ID
     * @returns Promise resolving to UpdateResponse with success message
     * 
     * @see Trick system for trick association management
     */
    async updateCharacterCompanion(data: UpdateCharacterCompanionRequest, query: { id: number }): Promise<UpdateResponse> {
        const { tricks, advancements, ...companionData } = data;

        const existing = await prisma.characterCompanion.findUnique({
            where: { id: query.id },
        });
        if (!existing) {
            throw new Error('Character companion not found');
        }

        const monsterId = companionData.monsterId ?? existing.monsterId;
        const companionId = companionData.companionId !== undefined ? companionData.companionId : existing.companionId;
        const trickPurposeId = companionData.trickPurposeId !== undefined
            ? companionData.trickPurposeId
            : existing.trickPurposeId;

        await companionAdvancementService.validateCompanionWrite({
            monsterId,
            companionId,
            characterId: existing.characterId,
            trickPurposeId,
            tricks,
            advancements,
        });

        const updateData: Prisma.CharacterCompanionUpdateInput = {};
        if (companionData.monsterId !== undefined) {
            updateData.monster = { connect: { id: companionData.monsterId } };
        }
        if (companionData.companionId !== undefined) {
            updateData.companion = companionData.companionId
                ? { connect: { id: companionData.companionId } }
                : { disconnect: true };
        }
        if (companionData.trickPurposeId !== undefined) {
            updateData.trickPurpose = companionData.trickPurposeId
                ? { connect: { id: companionData.trickPurposeId } }
                : { disconnect: true };
        }
        if (companionData.name !== undefined) {
            updateData.name = companionData.name;
        }
        if (companionData.levelAcquired !== undefined) {
            updateData.levelAcquired = companionData.levelAcquired;
        }
        if (companionData.hitPoints !== undefined) {
            updateData.hitPoints = companionData.hitPoints;
        }
        if (companionData.wounds !== undefined) {
            updateData.wounds = companionData.wounds;
        }
        if (companionData.maxHpAtFirstLevel !== undefined) {
            updateData.maxHpAtFirstLevel = companionData.maxHpAtFirstLevel;
        }
        if (advancements !== undefined) {
            updateData.hitPoints = sumAdvancementHitPoints(advancements);
        }

        await prisma.$transaction(async (tx) => {
            if (Object.keys(updateData).length > 0) {
                await tx.characterCompanion.update({
                    where: { id: query.id },
                    data: updateData,
                });
            }

            if (companionData.trickPurposeId !== undefined
                && companionData.trickPurposeId !== existing.trickPurposeId) {
                await applyTrickPurpose(tx, query.id, existing.trickPurposeId, companionData.trickPurposeId);
            }

            if (tricks !== undefined) {
                await tx.characterCompanionTrick.deleteMany({
                    where: { characterCompanionId: query.id, fromPurpose: false },
                });
                if (tricks.length > 0) {
                    await tx.characterCompanionTrick.createMany({
                        data: tricks.map((trick) => ({
                            characterCompanionId: query.id,
                            trickId: trick.trickId,
                            timesTrained: trick.timesTrained ?? 1,
                            isBonus: trick.isBonus ?? false,
                            fromPurpose: false,
                        })),
                        skipDuplicates: true,
                    });
                }
            }

            if (advancements !== undefined) {
                await persistCharacterCompanionAdvancements(tx, query.id, advancements);
            }
        });

        return { message: 'Character companion updated successfully' };
    },

    async deleteCharacterCompanion(query: { id: number }): Promise<UpdateResponse> {
        await prisma.characterCompanion.delete({
            where: { id: query.id }
        });

        return { message: 'Character companion deleted successfully' };
    },

    /**
     * Retrieves companion cache data with monster names for frontend use.
     * 
     * Design Decision: Cache Endpoint Pattern
     * - Returns lightweight companion data optimized for dropdowns and select components
     * - Includes monster name directly in response (populated from monster join)
     * - Reduces frontend complexity by eliminating need for separate monster cache lookup
     * - Orders by type and name for consistent presentation
     * 
     * @returns Promise resolving to CompanionCacheResponse with total count and results array
     * 
     * @see [Query Hooks and Caching Architecture](../../../../shared/docs/application-overview/query-hooks-and-caching.md)
     * @see [Cache-Based ID Maps](../../../../shared/docs/application-overview/cache-based-id-maps.md)
     */
    async getCompanionCache(): Promise<CompanionCacheResponse> {
        const companions = await prisma.companion.findMany({
            include: {
                monster: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: [
                { type: 'asc' },
                { monster: { name: 'asc' } },
            ],
        });

        const transformedCompanions = companions.map(companion => ({
            id: companion.id,
            type: companion.type,
            monsterId: companion.monsterId,
            minLevel: companion.minLevel,
            levelAdjustment: companion.levelAdjustment,
            name: companion.monster.name,
        }));

        return {
            total: transformedCompanions.length,
            results: transformedCompanions,
        };
    },
};

/**
 * Applies or clears a Handle Animal purpose package.
 * Combat Riding replacing Riding deletes every known trick first; other switches
 * drop only `fromPurpose` rows.
 */
async function applyTrickPurpose(
    tx: Prisma.TransactionClient,
    characterCompanionId: number,
    previousPurposeId: number | null,
    nextPurposeId: number | null
): Promise<void> {
    const nextPurpose = nextPurposeId
        ? await tx.trickPurpose.findUnique({
            where: { id: nextPurposeId },
            include: { tricks: true },
        })
        : null;

    const wipeAll = nextPurpose?.replacesPurposeId != null
        && previousPurposeId != null
        && nextPurpose.replacesPurposeId === previousPurposeId;

    if (wipeAll) {
        await tx.characterCompanionTrick.deleteMany({
            where: { characterCompanionId },
        });
    } else {
        await tx.characterCompanionTrick.deleteMany({
            where: { characterCompanionId, fromPurpose: true },
        });
    }

    if (!nextPurpose || nextPurpose.tricks.length === 0) {
        return;
    }

    await tx.characterCompanionTrick.createMany({
        data: nextPurpose.tricks.map((row) => ({
            characterCompanionId,
            trickId: row.trickId,
            timesTrained: row.timesTrained,
            isBonus: false,
            fromPurpose: true,
        })),
        skipDuplicates: true,
    });
}

