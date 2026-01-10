import { PrismaClient } from '@shared/prisma-client';
import {
    CompanionIdParamRequest,
    CreateCompanionRequest,
    UpdateCompanionRequest,
    GetAllCompanionsResponse,
    GetCompanionResponse,
    CreateResponse,
    UpdateResponse,
    CreateCharacterCompanionRequest,
    UpdateCharacterCompanionRequest,
    GetAllCharacterCompanionsResponse,
} from '@shared/schema';

import type { CompanionService } from './types';
import { featureSystemService } from '../featureSystem/featureSystemService';

const prisma = new PrismaClient();

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
 * - Feature System: Companion benefits managed through feature progressions
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
     * Retrieves a specific companion definition by ID with complete details including feature progressions.
     * 
     * Design Decision: Lightweight Schema Pattern
     * - Returns only monsterId, not nested monster object
     * - Frontend resolves monster names from pre-populated monsters-cache
     * - Reduces payload size and ensures consistent data resolution
     * 
     * Integrates with feature system service to retrieve companion benefit feature progressions,
     * ensuring companion benefits are properly loaded. Combines companion data with feature
     * progressions for complete response.
     * 
     * @param query - CompanionIdParamRequest with companion ID
     * @returns Promise resolving to GetCompanionResponse with complete companion data including
     *          feature progressions, or null if not found
     * 
     * @see featureSystemService.getFeatureProgressionsByCompanionId for feature retrieval
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

        // Get feature progressions using the feature system service
        const features = await featureSystemService.getFeatureProgressionsByCompanionId(query.id);

        // Combine companion data with feature progressions
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
                    companion: {
                        select: {
                            id: true,
                            type: true,
                            monsterId: true,
                            minLevel: true,
                        }
                    },
                    tricks: {
                        include: {
                            trick: true
                        }
                    }
                },
                orderBy: { levelAcquired: 'asc' }
            }),
            prisma.characterCompanion.count({ where: { characterId } }),
        ]);

        return {
            total,
            results: companions.map(companion => ({
                ...companion,
                companion: companion.companion ?? undefined,
            })),
        };
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
        const { tricks, ...companionData } = data;

        // Get monster averageHP if hitPoints not provided
        let hitPoints = companionData.hitPoints;
        if (!hitPoints) {
            const monster = await prisma.monster.findUnique({
                where: { id: companionData.monsterId },
                select: { averageHP: true }
            });
            hitPoints = monster?.averageHP || null;
        }

        const result = await prisma.$transaction(async (tx) => {
            // Create the character companion
            const characterCompanion = await tx.characterCompanion.create({
                data: {
                    characterId: companionData.characterId,
                    monsterId: companionData.monsterId,
                    companionId: companionData.companionId || null,
                    levelAcquired: companionData.levelAcquired || null,
                    hitPoints: hitPoints,
                    wounds: companionData.wounds || 0,
                }
            });

            // Create trick associations if provided
            if (tricks && tricks.length > 0) {
                await tx.characterCompanionTrick.createMany({
                    data: tricks.map((trickId) => ({
                        characterCompanionId: characterCompanion.id,
                        trickId: trickId,
                    }))
                });
            }

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
        const { tricks, ...companionData } = data;

        await prisma.$transaction(async (tx) => {
            // Update the character companion
            await tx.characterCompanion.update({
                where: { id: query.id },
                data: {
                    monsterId: companionData.monsterId,
                    companionId: companionData.companionId,
                    levelAcquired: companionData.levelAcquired,
                    hitPoints: companionData.hitPoints,
                    wounds: companionData.wounds,
                }
            });

            // Update tricks if provided
            if (tricks !== undefined) {
                // Delete existing tricks
                await tx.characterCompanionTrick.deleteMany({
                    where: { characterCompanionId: query.id }
                });

                // Create new tricks
                if (tricks.length > 0) {
                    await tx.characterCompanionTrick.createMany({
                        data: tricks.map((trickId) => ({
                            characterCompanionId: query.id,
                            trickId: trickId,
                        }))
                    });
                }
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
};

