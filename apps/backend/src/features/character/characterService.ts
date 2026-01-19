/**
 * Character Service - Central service for all character management operations.
 * 
 * This service provides comprehensive character management capabilities including:
 * - Character CRUD operations (create, read, update, delete)
 * - Character advancement and level progression management
 * - Ability score management and calculations
 * - Spell preparation and spell known management
 * - Character attack definition management
 * - Character disallowed source management
 * - Integration with character resolution system for feature resolution
 * - Integration with spell system for spell operations
 * 
 * Architecture Decisions:
 * - Service-Oriented: All character operations flow through this service, ensuring
 *   consistency and proper transaction handling
 * - Integration Points: Integrates with character resolution, spell, class, and race
 *   services to provide complete character functionality
 * - Transaction Safety: Uses Prisma transactions for multi-table operations to ensure
 *   data consistency
 * - Gestalt Support: Handles both single-class and gestalt (dual-class) characters
 *   with proper level calculation and display
 * 
 * Usage Pattern:
 * Controllers call service methods which handle all business logic, database operations,
 * and cross-service integration. The service ensures data consistency and proper error
 * handling throughout.
 * 
 * Source File: `apps/backend/src/features/character/characterService.ts`
 * 
 * @see CharacterService interface for method signatures
 * @see characterController for HTTP request handling
 * @see characterRoutes for API endpoint definitions
 */

import { PrismaClient } from '@shared/prisma-client';
import type {
    CharacterIdParamRequest,
    Character,
    CreateCharacterRequest,
    CreateResponse,
    GetAllCharactersResponse,
    GetAllCharactersAdminResponse,
    UpdateResponse,
    // New types for advancement and spell preparation
    CreateAdvancementRequest,
    UpdateAdvancementRequest,
    CharacterAdvancementWithDetailsResponse,
    CreateSpellPreparationRequest,
    UpdateSpellPreparationRequest,
    CharacterSpellPreparationResponse,
    CreateCharacterAbilityScoreRequest,
    UpdateCharacterAbilityScoreRequest,
    CharacterAbilityScoreResponse,
    CharacterWithAllDetailsResponse,
    SaveCharacterRequest,
    // NEW: Character disallowed source types
    CreateCharacterDisallowedSourceRequest,
    CharacterDisallowedSource,
    // NEW: Character attack definition types
    CreateCharacterAttackDefinitionRequest,
    UpdateCharacterAttackDefinitionRequest,
    CharacterAttackDefinition,
    // NEW: Spell types
    Spell,
    AddSpellKnownResponse,
    RemoveSpellKnownResponse,
    FeatureProgression,
    UpdateMoneyRequest,
    AddItemRequest,
    UpdateWoundsRequest,
    UpdateNotesRequest,
    SyncItemsRequest,
    SyncSpellPreparationsRequest,
    SyncSpellsKnownRequest,
    ResolvedCharacterResult,
} from '@shared/schema';
import { EditionId, ARMOR_CATEGORY_ENUM, EntityAppliesToType, EntityType, USES_FREQUENCY_ENUM, SpellSlotType } from '@shared/static-data';
import {
    isGestaltCharacter,
    calculateGestaltCharacterStats,
    calculateGestaltStats,
    getGestaltClassesForLevel,
    validateGestaltClasses,
    type GestaltStats
} from '@shared/utils';

import type { CharacterService } from './types';
import { AvailableFeatService } from '../characterResolution/availableFeatService';
import { buildCharacterEditState } from '../characterResolution/characterEditStateBuilder';
import { CharacterResolutionService } from '../characterResolution/characterResolutionService';
import { CharacterSessionService } from '../characterResolution/characterSessionService';
import { ResolvedFeatureService } from '../characterResolution/resolvedFeatureService';
import type { ResolutionContext, UserChoices } from '../characterResolution/types';
import { classService } from '../class/classService';
import { featService } from '../feat/featService';
import { featureSystemService } from '../featureSystem/featureSystemService';
import { raceService } from '../race/raceService';
import { spellService } from '../spell';

const prisma = new PrismaClient();

/**
 * Character service implementation providing all character management operations.
 * 
 * This service object implements the CharacterService interface and provides
 * all methods for character CRUD, advancement, ability scores, spells, and
 * related operations.
 */
export const characterService: CharacterService = {
    /**
     * Retrieves all characters for a specific user with race information and class/level strings.
     * 
     * Architecture Decision: Calculates character level and class/level strings on the fly
     * rather than storing them, ensuring they're always current based on advancements.
     * 
     * @param userId - The user ID to retrieve characters for
     * @returns Promise resolving to GetAllCharactersResponse with total count and character array
     * 
     * @example
     * ```typescript
     * const result = await characterService.getAllCharacters(userId);
     * // result.total = 5
     * // result.results = [{ id: 1, name: "Gandalf", characterLevel: 10, classLevelString: "Wiz 10", ... }, ...]
     * ```
     */
    /**
     * Retrieves all characters for a specific user with race information and class/level strings.
     * 
     * Design Decision: Lightweight Schema Pattern
     * - Returns only raceId, not nested race object
     * - Frontend resolves race names from pre-populated races-cache
     * - Class abbreviations are selected for classLevelString calculation but not included in response
     * - Reduces payload size and ensures consistent data resolution
     * 
     * Architecture Decision: Calculates character level and class/level strings on the fly
     * rather than storing them, ensuring they're always current based on advancements.
     * 
     * @param userId - The user ID to retrieve characters for
     * @returns Promise resolving to GetAllCharactersResponse with total count and character array
     * 
     * @see [Cache-Based ID Maps](../../../../shared/docs/application-overview/cache-based-id-maps.md)
     * @see [Lightweight Schema Pattern](../../../../shared/docs/application-overview/validation-schemas.md#lightweight-response-schemas)
     */
    async getAllCharacters(userId: number): Promise<GetAllCharactersResponse> {
        const [characters, total] = await Promise.all([
            prisma.userCharacter.findMany({
                where: { userId },
                include: {
                    advancements: {
                        include: {
                            class: {
                                select: {
                                    id: true,
                                    abbreviation: true,
                                },
                            },
                            secondaryClass: {
                                select: {
                                    id: true,
                                    abbreviation: true,
                                },
                            },
                        },
                        orderBy: { level: 'asc' },
                    },
                },
                orderBy: { name: 'asc' },
            }),
            prisma.userCharacter.count({
                where: { userId },
            }),
        ]);

        // Calculate class/level string and character level for each character
        const charactersWithClassInfo = characters.map(character => {
            const advancements = character.advancements || [];

            // Calculate character level (max level from advancements)
            const characterLevel = advancements.length > 0
                ? Math.max(...advancements.map(a => a.level))
                : 0;

            // Build class/level string
            let classLevelString = '';
            if (advancements.length > 0) {
                // Sort advancements by level
                const sortedAdvancements = [...advancements].sort((a, b) => a.level - b.level);

                const parts: string[] = [];

                sortedAdvancements.forEach(adv => {
                    const primaryAbbr = adv.class?.abbreviation || '?';
                    const secondaryAbbr = adv.secondaryClass?.abbreviation || null;

                    if (secondaryAbbr) {
                        // Gestalt: "Ftr/Clr 1" (both classes at same level)
                        parts.push(`${primaryAbbr}/${secondaryAbbr} ${adv.level}`);
                    } else {
                        // Single class: "Ftr 1"
                        parts.push(`${primaryAbbr} ${adv.level}`);
                    }
                });

                // Join with "/" for multiclass: "Ftr 1/Clr 1"
                classLevelString = parts.join('/');
            }

            // Remove nested objects from response (class abbreviations used only for calculation)
            const advancementsWithoutNested = advancements.map(adv => {
                const { class: _class, secondaryClass: _secondaryClass, ...advWithoutNested } = adv;
                return advWithoutNested;
            });

            return {
                ...character,
                advancements: advancementsWithoutNested,
                characterLevel,
                classLevelString,
            };
        });

        return {
            total,
            results: charactersWithClassInfo,
        };
    },

    /**
     * Retrieves all characters for admin users with user information included.
     * 
     * Architecture Decision: Separate admin method includes user information for
     * administrative oversight, while regular getAllCharacters only includes character data.
     * 
     * @returns Promise resolving to GetAllCharactersAdminResponse with all characters and user info
     */
    async getAllCharactersAdmin(): Promise<GetAllCharactersAdminResponse> {
        const [characters, total] = await Promise.all([
            prisma.userCharacter.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                        },
                    },
                    advancements: {
                        include: {
                            class: {
                                select: {
                                    id: true,
                                    abbreviation: true,
                                },
                            },
                            secondaryClass: {
                                select: {
                                    id: true,
                                    abbreviation: true,
                                },
                            },
                        },
                        orderBy: { level: 'asc' },
                    },
                },
                orderBy: { name: 'asc' },
            }),
            prisma.userCharacter.count(),
        ]);

        // Calculate class/level string and character level for each character
        const charactersWithClassInfo = characters.map(character => {
            const advancements = character.advancements || [];

            // Calculate character level (max level from advancements)
            const characterLevel = advancements.length > 0
                ? Math.max(...advancements.map(a => a.level))
                : 0;

            // Build class/level string
            let classLevelString = '';
            if (advancements.length > 0) {
                // Sort advancements by level
                const sortedAdvancements = [...advancements].sort((a, b) => a.level - b.level);

                const parts: string[] = [];

                sortedAdvancements.forEach(adv => {
                    const primaryAbbr = adv.class?.abbreviation || '?';
                    const secondaryAbbr = adv.secondaryClass?.abbreviation || null;

                    if (secondaryAbbr) {
                        // Gestalt: "Ftr/Clr 1" (both classes at same level)
                        parts.push(`${primaryAbbr}/${secondaryAbbr} ${adv.level}`);
                    } else {
                        // Single class: "Ftr 1"
                        parts.push(`${primaryAbbr} ${adv.level}`);
                    }
                });

                // Join with "/" for multiclass: "Ftr 1/Clr 1"
                classLevelString = parts.join('/');
            }

            // Exclude advancements from response (not in schema)
            const { advancements: _advancements, ...characterBase } = character;

            return {
                ...characterBase,
                characterLevel,
                classLevelString,
            };
        });

        return {
            total,
            results: charactersWithClassInfo,
        };
    },

    /**
     * Retrieves a character by ID with basic information including race and deity.
     * 
     * Architecture Decision: Returns basic character data for list views and simple
     * operations. Use getCharacterWithAllDetails for complete character data.
     * 
     * @param query - CharacterIdParamRequest with character ID
     * @returns Promise resolving to Character object or null if not found
     */
    async getCharacterById(query: CharacterIdParamRequest): Promise<Character | null> {
        const character = await prisma.userCharacter.findUnique({
            where: { id: query.id },
            include: {
                race: {
                    select: {
                        name: true,
                    },
                },
                deity: {
                    select: {
                        id: true,
                        name: true,
                        alignmentId: true,
                    },
                },
            },
        });

        return character as Character;
    },

    /**
     * Retrieves a character with all related details including advancements, ability scores,
     * spell preparations, attack definitions, and disallowed sources.
     * 
     * Architecture Decision: Loads all related data in a single query for complete character
     * context. Used by character resolution system and detailed character views.
     * 
     * @param query - CharacterIdParamRequest with character ID
     * @returns Promise resolving to CharacterWithAllDetailsResponse or null if not found
     */
    /**
     * Retrieves a character with all related details including advancements, ability scores,
     * spell preparations, attack definitions, and disallowed sources.
     * 
     * Design Decision: Lightweight Schema Pattern
     * - Returns only raceId, deityId, classId, and secondaryClassId, not nested objects
     * - Frontend resolves entity names from pre-populated caches (races, deities, classes)
     * - Class abbreviations are selected for classLevelString calculation but not included in response
     * - Reduces payload size and ensures consistent data resolution
     * 
     * Architecture Decision: Loads all related data in a single query for complete character
     * context. Used by character resolution system and detailed character views.
     * 
     * @param query - CharacterIdParamRequest with character ID
     * @returns Promise resolving to CharacterWithAllDetailsResponse or null if not found
     * 
     * @see [Cache-Based ID Maps](../../../../shared/docs/application-overview/cache-based-id-maps.md)
     * @see [Lightweight Schema Pattern](../../../../shared/docs/application-overview/validation-schemas.md#lightweight-response-schemas)
     */
    async getCharacterWithAllDetails(query: CharacterIdParamRequest): Promise<CharacterWithAllDetailsResponse | null> {
        const character = await prisma.userCharacter.findUnique({
            where: { id: query.id },
            include: {
                advancements: {
                    include: {
                        class: {
                            select: {
                                id: true,
                                abbreviation: true,
                            },
                        },
                        secondaryClass: {
                            select: {
                                id: true,
                                abbreviation: true,
                            },
                        },
                        skills: true,
                        feats: true,
                        spellsKnown: true,
                        featureChoices: true,
                    },
                    orderBy: { level: 'asc' },
                },
                abilityScores: true,
                preparedSpells: true,
                disallowedSources: true,
                characterItems: true,
                attackDefinitions: true,
                characterLanguages: true,
            },
        });

        if (!character) {
            return null;
        }

        const advancements = character.advancements || [];

        // Calculate character level (max level from advancements)
        const characterLevel = advancements.length > 0
            ? Math.max(...advancements.map(a => a.level))
            : 0;

        // Build class/level string
        let classLevelString = '';
        if (advancements.length > 0) {
            // Sort advancements by level
            const sortedAdvancements = [...advancements].sort((a, b) => a.level - b.level);

            const parts: string[] = [];

            sortedAdvancements.forEach(adv => {
                const primaryAbbr = adv.class?.abbreviation || '?';
                const secondaryAbbr = adv.secondaryClass?.abbreviation || null;

                if (secondaryAbbr) {
                    // Gestalt: "Ftr/Clr 1" (both classes at same level)
                    parts.push(`${primaryAbbr}/${secondaryAbbr} ${adv.level}`);
                } else {
                    // Single class: "Ftr 1"
                    parts.push(`${primaryAbbr} ${adv.level}`);
                }
            });

            // Join with "/" for multiclass: "Ftr 1/Clr 1"
            classLevelString = parts.join('/');
        }

        // Remove nested objects from response (class abbreviations used only for calculation)
        const advancementsWithoutNested = advancements.map(adv => {
            const { class: _class, secondaryClass: _secondaryClass, ...advWithoutNested } = adv;
            return advWithoutNested;
        });

        // Cast preparedSpells slotType to match schema type
        const preparedSpells = character.preparedSpells.map(prep => ({
            ...prep,
            slotType: prep.slotType as SpellSlotType,
        }));

        return {
            ...character,
            advancements: advancementsWithoutNested,
            preparedSpells,
            characterLevel,
            classLevelString,
        };
    },

    /**
     * Creates a new character with validation and relationship setup.
     * 
     * Architecture Decision: Creates character with minimal required data. Additional
     * data (advancements, ability scores) are added through separate endpoints or saveCharacter.
     * 
     * @param data - CreateCharacterRequest with character creation data
     * @returns Promise resolving to CreateResponse with created character ID
     */
    async createCharacter(data: CreateCharacterRequest): Promise<CreateResponse> {
        const result = await prisma.userCharacter.create({
            data: {
                ...data,
                editionId: data.editionId ?? EditionId.DND_3_5E, // Default to D&D 3.5 Edition if not provided
            },
        });

        return { id: result.id.toString(), message: 'Character created successfully' };
    },

    /**
     * Unified save operation that handles both character creation and updates, including
     * ability scores and advancement in a single transaction.
     * 
     * Architecture Decision: Single save endpoint handles complete character state updates
     * in one transaction, ensuring data consistency. Supports both create (characterId null)
     * and update (characterId provided) operations.
     * 
     * @param characterId - Character ID for updates, null for creation
     * @param data - SaveCharacterRequest with complete character data including ability scores and advancement
     * @returns Promise resolving to CreateResponse (if new) or UpdateResponse (if updated)
     */
    async saveCharacter(characterId: number | null, data: SaveCharacterRequest): Promise<CreateResponse | UpdateResponse> {
        // Extract nested data
        const { abilityScores, advancement, equipment, attackDefinitions, characterLanguages, ...characterData } = data;

        return await prisma.$transaction(async (tx) => {
            let finalCharacterId = characterId;

            // Create or update character
            if (!finalCharacterId) {
                // Create new character - ensure required fields are present
                if (!characterData.userId || !characterData.name || !characterData.raceId) {
                    throw new Error('Missing required fields: userId, name, and raceId are required for character creation');
                }
                const character = await tx.userCharacter.create({
                    data: {
                        userId: characterData.userId,
                        name: characterData.name,
                        raceId: characterData.raceId,
                        alignmentId: characterData.alignmentId ?? null,
                        deityId: characterData.deityId ?? null,
                        age: characterData.age ?? null,
                        height: characterData.height ?? null,
                        weight: characterData.weight ?? null,
                        eyes: characterData.eyes ?? null,
                        hair: characterData.hair ?? null,
                        gender: characterData.gender ?? null,
                        notes: characterData.notes ?? null,
                        editionId: characterData.editionId != null ? characterData.editionId : EditionId.DND_3_5E, // Default to D&D 3.5 Edition if not provided or null
                        allowVariantClasses: characterData.allowVariantClasses ?? false,
                        isGestalt: characterData.isGestalt ?? false,
                        ignoreLevelAdjustment: characterData.ignoreLevelAdjustment ?? false,
                        platinum: characterData.platinum ?? 0,
                        gold: characterData.gold ?? 0,
                        silver: characterData.silver ?? 0,
                        copper: characterData.copper ?? 0,
                    },
                });
                finalCharacterId = character.id;
            } else {
                // Update existing character - exclude userId as it shouldn't be updated
                const { userId: _userId, ...updateData } = characterData;
                await tx.userCharacter.update({
                    where: { id: finalCharacterId },
                    data: updateData as typeof updateData & { editionId?: number },
                });
            }

            // Handle ability scores if provided
            if (abilityScores !== undefined) {
                // Get existing ability scores
                const existingScores = await tx.userCharacterAbilityScore.findMany({
                    where: { characterId: finalCharacterId },
                });

                const existingMap = new Map(existingScores.map(score => [score.abilityId, score]));
                const requestedAbilityIds = new Set(abilityScores.map(score => score.abilityId));

                // Create or update ability scores
                for (const abilityScore of abilityScores) {
                    const existing = existingMap.get(abilityScore.abilityId);
                    if (existing) {
                        if (existing.value !== abilityScore.value) {
                            await tx.userCharacterAbilityScore.update({
                                where: { id: existing.id },
                                data: { value: abilityScore.value },
                            });
                        }
                    } else {
                        await tx.userCharacterAbilityScore.create({
                            data: {
                                characterId: finalCharacterId,
                                abilityId: abilityScore.abilityId,
                                value: abilityScore.value,
                            },
                        });
                    }
                }

                // Delete scores that are no longer in the request
                const toDelete = existingScores.filter(score => !requestedAbilityIds.has(score.abilityId));
                if (toDelete.length > 0) {
                    await tx.userCharacterAbilityScore.deleteMany({
                        where: {
                            id: { in: toDelete.map(score => score.id) },
                        },
                    });
                }
            }

            // Handle advancement if provided
            if (advancement) {
                // Check if advancement exists for this character and level
                const existingAdvancement = await tx.characterAdvancement.findFirst({
                    where: {
                        characterId: finalCharacterId,
                        level: advancement.level,
                    },
                });

                const { skills, feats, featureChoices, ...advancementData } = advancement;

                if (existingAdvancement) {
                    // Update existing advancement
                    await tx.characterAdvancement.update({
                        where: { id: existingAdvancement.id },
                        data: {
                            ...advancementData,
                            characterId: finalCharacterId,
                        },
                    });

                    // Handle skills: delete existing and create new if provided
                    if (skills !== undefined) {
                        await tx.advancementSkill.deleteMany({
                            where: { advancementId: existingAdvancement.id },
                        });
                        if (skills.length > 0) {
                            await tx.advancementSkill.createMany({
                                data: skills.map(skill => ({
                                    ...skill,
                                    advancementId: existingAdvancement.id,
                                })),
                            });
                        }
                    }

                    // Handle feats: delete existing and create new if provided
                    if (feats !== undefined) {
                        await tx.advancementFeat.deleteMany({
                            where: { advancementId: existingAdvancement.id },
                        });
                        if (feats.length > 0) {
                            await tx.advancementFeat.createMany({
                                data: feats.map(feat => ({
                                    ...feat,
                                    advancementId: existingAdvancement.id,
                                })),
                            });
                        }
                    }

                    // Handle featureChoices: delete existing and create new if provided
                    if (featureChoices !== undefined) {
                        await tx.characterFeatureChoice.deleteMany({
                            where: { advancementId: existingAdvancement.id },
                        });
                        if (featureChoices.length > 0) {
                            await tx.characterFeatureChoice.createMany({
                                data: featureChoices.map(choice => ({
                                    ...choice,
                                    characterId: finalCharacterId,
                                    advancementId: existingAdvancement.id,
                                })),
                            });
                        }
                    }
                } else {
                    // Create new advancement
                    // Note: When using nested creates, Prisma automatically sets advancementId
                    // so we should NOT include it in the create data
                    const newAdvancement = await tx.characterAdvancement.create({
                        data: {
                            ...advancementData,
                            characterId: finalCharacterId,
                            version: 1,
                            skills: skills ? {
                                create: skills
                            } : undefined,
                            feats: feats ? {
                                create: feats
                            } : undefined,
                            featureChoices: featureChoices ? {
                                create: featureChoices.map(choice => {
                                    // advancementId is not in the choice type - Prisma sets it automatically via the relationship
                                    return {
                                        ...choice,
                                        characterId: finalCharacterId,
                                    };
                                })
                            } : undefined,
                        },
                    });

                }
            }

            // Handle equipment if provided
            // We need to track item ID mappings for attack definitions
            const itemIdMap = new Map<number, number>(); // old item ID -> new item ID

            if (equipment !== undefined) {
                // Get existing equipment
                const existingEquipment = await tx.characterItem.findMany({
                    where: { characterId: finalCharacterId },
                });

                // Create multiple maps for flexible matching:
                // 1. Exact match: baseItemId|location|name -> old item ID
                const exactMatchMap = new Map<string, number>();
                // 2. Location match: baseItemId|location -> array of old item IDs
                const locationMatchMap = new Map<string, number[]>();
                // 3. BaseItemId match: baseItemId -> array of old item IDs
                const baseItemMatchMap = new Map<number, number[]>();

                for (const existingItem of existingEquipment) {
                    const exactKey = `${existingItem.baseItemId}|${existingItem.location ?? 'null'}|${existingItem.name}`;
                    exactMatchMap.set(exactKey, existingItem.id);

                    const locationKey = `${existingItem.baseItemId}|${existingItem.location ?? 'null'}`;
                    if (!locationMatchMap.has(locationKey)) {
                        locationMatchMap.set(locationKey, []);
                    }
                    locationMatchMap.get(locationKey)!.push(existingItem.id);

                    if (!baseItemMatchMap.has(existingItem.baseItemId)) {
                        baseItemMatchMap.set(existingItem.baseItemId, []);
                    }
                    baseItemMatchMap.get(existingItem.baseItemId)!.push(existingItem.id);
                }

                // Track which old IDs have been matched to avoid duplicate mappings
                const matchedOldIds = new Set<number>();

                // Delete all existing equipment
                if (existingEquipment.length > 0) {
                    await tx.characterItem.deleteMany({
                        where: { characterId: finalCharacterId },
                    });
                }

                // Create new equipment items and build ID mapping
                if (equipment.length > 0) {
                    const createdItems = await Promise.all(
                        equipment.map(async (item) => {
                            const created = await tx.characterItem.create({
                                data: {
                                    characterId: finalCharacterId,
                                    name: item.name,
                                    quantity: item.quantity ?? null,
                                    location: item.location ?? null,
                                    baseItemId: item.baseItemId,
                                },
                            });

                            // Try multiple matching strategies in order of preference
                            let oldId: number | undefined;

                            // Strategy 1: Exact match (baseItemId|location|name)
                            const exactKey = `${item.baseItemId}|${item.location ?? 'null'}|${item.name}`;
                            const exactMatch = exactMatchMap.get(exactKey);
                            if (exactMatch && !matchedOldIds.has(exactMatch)) {
                                oldId = exactMatch;
                            } else {
                                // Strategy 2: Location match (baseItemId|location) - only if exactly one match
                                const locationKey = `${item.baseItemId}|${item.location ?? 'null'}`;
                                const locationMatches = locationMatchMap.get(locationKey);
                                if (locationMatches && locationMatches.length === 1 && !matchedOldIds.has(locationMatches[0])) {
                                    oldId = locationMatches[0];
                                } else {
                                    // Strategy 3: BaseItemId match - only if exactly one match
                                    const baseItemMatches = baseItemMatchMap.get(item.baseItemId);
                                    if (baseItemMatches && baseItemMatches.length === 1 && !matchedOldIds.has(baseItemMatches[0])) {
                                        oldId = baseItemMatches[0];
                                    }
                                }
                            }

                            if (oldId) {
                                itemIdMap.set(oldId, created.id);
                                matchedOldIds.add(oldId);
                            }

                            return created;
                        })
                    );
                }
            }

            // Handle attack definitions if provided
            if (attackDefinitions !== undefined) {
                // Get existing attack definitions
                const existingAttackDefinitions = await tx.characterAttackDefinition.findMany({
                    where: { characterId: finalCharacterId },
                });

                // Delete all existing attack definitions
                if (existingAttackDefinitions.length > 0) {
                    await tx.characterAttackDefinition.deleteMany({
                        where: { characterId: finalCharacterId },
                    });
                }

                // Create new attack definitions with mapped item IDs
                if (attackDefinitions.length > 0) {
                    // Get all current character items to validate references
                    const currentItems = await tx.characterItem.findMany({
                        where: { characterId: finalCharacterId },
                    });
                    const validItemIds = new Set(currentItems.map(item => item.id));

                    await tx.characterAttackDefinition.createMany({
                        data: attackDefinitions.map(def => {
                            // Map old item IDs to new ones if equipment was recreated
                            let mainHandItemId = def.mainHandCharacterItemId
                                ? (itemIdMap.get(def.mainHandCharacterItemId) ?? def.mainHandCharacterItemId)
                                : null;
                            let offHandItemId = def.offHandCharacterItemId
                                ? (itemIdMap.get(def.offHandCharacterItemId) ?? def.offHandCharacterItemId)
                                : null;

                            // Validate that the item IDs exist (after mapping)
                            if (mainHandItemId && !validItemIds.has(mainHandItemId)) {
                                mainHandItemId = null; // Clear invalid reference
                            }
                            if (offHandItemId && !validItemIds.has(offHandItemId)) {
                                offHandItemId = null; // Clear invalid reference
                            }

                            return {
                                characterId: finalCharacterId,
                                attackSlot: def.attackSlot ?? null,
                                mainHandCharacterItemId: mainHandItemId,
                                offHandCharacterItemId: offHandItemId,
                            };
                        }),
                    });
                }
            }

            // Handle character languages if provided
            if (characterLanguages !== undefined) {
                // Delete existing languages
                await tx.characterLanguageMap.deleteMany({
                    where: { characterId: finalCharacterId },
                });
                // Create new languages
                if (characterLanguages.length > 0) {
                    await tx.characterLanguageMap.createMany({
                        data: characterLanguages.map(lang => ({
                            characterId: finalCharacterId,
                            languageId: lang.languageId,
                        })),
                    });
                }
            }

            if (characterId) {
                return { message: 'Character saved successfully' };
            } else {
                return { id: finalCharacterId.toString(), message: 'Character created successfully' };
            }
        });
    },

    /**
     * Deletes a character and all related data including advancements, ability scores,
     * spell preparations, attack definitions, and disallowed sources.
     * 
     * Architecture Decision: Uses Prisma cascade deletes to ensure all related data
     * is removed when a character is deleted, maintaining referential integrity.
     * 
     * @param query - CharacterIdParamRequest with character ID
     * @returns Promise resolving to UpdateResponse with success message
     */
    async deleteCharacter(query: CharacterIdParamRequest): Promise<UpdateResponse> {
        await prisma.userCharacter.delete({
            where: { id: query.id },
        });

        return { message: 'Character deleted successfully' };
    },

    // Character advancement methods
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
                    progressionId: { in: featureChoices.map(c => c.progressionId) }
                },
                data: {
                    advancementId: result.id
                }
            });
        }

        // Auto-grant 0th level spells for spellbook classes on first level
        // Check if this class is a spellbook class by checking for FeatureProgression with SpellbookSpell entity
        // Check if class has spellbook spell feature via many-to-many relationship
        const classLinks = await prisma.featureProgressionClassMap.findMany({
            where: { classId: advancementData.classId },
            select: { progressionId: true }
        });
        const progressionIds = classLinks.map(link => link.progressionId);

        const isSpellbookClass = await prisma.featureEntity.findFirst({
            where: {
                featureProgression: {
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

    // Spell preparation methods
    async createSpellPreparation(characterId: number, data: CreateSpellPreparationRequest): Promise<CreateResponse> {
        // Check if a preparation already exists with the same combination
        const slotType = data.slotType ?? 0;
        const existing = await prisma.characterSpellPreparation.findFirst({
            where: {
                characterId: characterId,
                classId: data.classId,
                spellId: data.spellId,
                spellLevel: data.spellLevel,
                slotType: slotType,
                featId: data.featId ?? null,
            },
        });

        let result;
        if (existing) {
            // Update existing preparation by incrementing quantity
            result = await prisma.characterSpellPreparation.update({
                where: { id: existing.id },
                data: {
                    quantity: {
                        increment: data.quantity,
                    },
                },
            });
        } else {
            // Create new preparation
            result = await prisma.characterSpellPreparation.create({
                data: {
                    characterId: characterId,
                    ...data,
                    slotType: slotType,
                },
            });
        }

        return { id: result.id.toString(), message: 'Spell preparation created successfully' };
    },

    async updateSpellPreparation(preparationId: number, data: UpdateSpellPreparationRequest): Promise<UpdateResponse> {
        await prisma.characterSpellPreparation.update({
            where: {
                id: preparationId,
            },
            data,
        });

        return { message: 'Spell preparation updated successfully' };
    },

    async deleteSpellPreparation(preparationId: number): Promise<UpdateResponse> {
        await prisma.characterSpellPreparation.delete({
            where: {
                id: preparationId,
            },
        });

        return { message: 'Spell preparation deleted successfully' };
    },

    async getCharacterSpellPreparations(characterId: number): Promise<CharacterSpellPreparationResponse[]> {
        const preparations = await prisma.characterSpellPreparation.findMany({
            where: { characterId: characterId },
            include: {
                feat: true,
            },
        });

        return preparations.map(prep => ({
            ...prep,
            slotType: prep.slotType as SpellSlotType,
        })) as CharacterSpellPreparationResponse[];
    },

    // Character ability score methods
    async createCharacterAbilityScore(data: CreateCharacterAbilityScoreRequest): Promise<CreateResponse> {
        const result = await prisma.userCharacterAbilityScore.create({
            data,
        });

        return { id: result.id.toString(), message: 'Character ability score created successfully' };
    },

    async updateCharacterAbilityScore(id: number, data: UpdateCharacterAbilityScoreRequest): Promise<UpdateResponse> {
        await prisma.userCharacterAbilityScore.update({
            where: { id },
            data,
        });

        return { message: 'Character ability score updated successfully' };
    },

    async deleteCharacterAbilityScore(id: number): Promise<UpdateResponse> {
        await prisma.userCharacterAbilityScore.delete({
            where: { id },
        });

        return { message: 'Character ability score deleted successfully' };
    },

    async upsertCharacterAbilityScores(data: { characterId: number; abilityScores: Array<{ abilityId: number; value: number }> }): Promise<UpdateResponse> {
        // Use a transaction to ensure all operations succeed or fail together
        await prisma.$transaction(async (tx) => {
            // Get existing ability scores for this character
            const existingScores = await tx.userCharacterAbilityScore.findMany({
                where: { characterId: data.characterId },
            });

            // Create a map of existing scores by abilityId
            const existingMap = new Map(existingScores.map(score => [score.abilityId, score]));

            // Process each ability score in the request
            for (const abilityScore of data.abilityScores) {
                const existing = existingMap.get(abilityScore.abilityId);
                if (existing) {
                    // Update existing score if value changed
                    if (existing.value !== abilityScore.value) {
                        await tx.userCharacterAbilityScore.update({
                            where: { id: existing.id },
                            data: { value: abilityScore.value },
                        });
                    }
                } else {
                    // Create new score
                    await tx.userCharacterAbilityScore.create({
                        data: {
                            characterId: data.characterId,
                            abilityId: abilityScore.abilityId,
                            value: abilityScore.value,
                        },
                    });
                }
            }

            // Delete scores that are no longer in the request
            const requestedAbilityIds = new Set(data.abilityScores.map(score => score.abilityId));
            const toDelete = existingScores.filter(score => !requestedAbilityIds.has(score.abilityId));

            if (toDelete.length > 0) {
                await tx.userCharacterAbilityScore.deleteMany({
                    where: {
                        id: { in: toDelete.map(score => score.id) },
                    },
                });
            }
        });

        return { message: 'Character ability scores updated successfully' };
    },

    async getCharacterAbilityScores(characterId: number): Promise<CharacterAbilityScoreResponse[]> {
        const abilities = await prisma.userCharacterAbilityScore.findMany({
            where: { characterId },
        });

        return abilities as CharacterAbilityScoreResponse[];
    },

    // NEW: Character disallowed sources methods
    async addDisallowedSource(data: CreateCharacterDisallowedSourceRequest): Promise<CharacterDisallowedSource> {
        // Check if trying to disallow an always available source
        const sourceBook = await prisma.sourceBook.findUnique({
            where: { id: data.sourceBookId },
            select: { name: true }
        });

        if (!sourceBook) {
            throw new Error('Source book not found');
        }

        const disallowedSource = await prisma.characterDisallowedSource.create({
            data,
            include: {
                sourceBook: {
                    select: {
                        id: true,
                        name: true,
                        abbreviation: true,
                    },
                },
            },
        });

        return disallowedSource as CharacterDisallowedSource;
    },

    async removeDisallowedSource(characterId: number, sourceBookId: number): Promise<UpdateResponse> {
        await prisma.characterDisallowedSource.deleteMany({
            where: {
                characterId,
                sourceBookId,
            },
        });
        return { message: 'Disallowed source removed successfully' };
    },

    async getDisallowedSources(characterId: number): Promise<CharacterDisallowedSource[]> {
        const disallowedSources = await prisma.characterDisallowedSource.findMany({
            where: { characterId },
            include: {
                sourceBook: {
                    select: {
                        id: true,
                        name: true,
                        abbreviation: true,
                    },
                },
            },
        });

        return disallowedSources as CharacterDisallowedSource[];
    },

    // Character attack definition methods
    async getCharacterAttackDefinitions(characterId: number): Promise<CharacterAttackDefinition[]> {
        const attackDefinitions = await prisma.characterAttackDefinition.findMany({
            where: { characterId },
            orderBy: { attackSlot: 'asc' },
        });

        return attackDefinitions as CharacterAttackDefinition[];
    },

    async createCharacterAttackDefinition(characterId: number, data: CreateCharacterAttackDefinitionRequest): Promise<CreateResponse> {
        // Validate that character items belong to the character
        if (data.mainHandCharacterItemId) {
            const mainHandItem = await prisma.characterItem.findFirst({
                where: {
                    id: data.mainHandCharacterItemId,
                    characterId: characterId,
                },
            });
            if (!mainHandItem) {
                throw new Error('Main hand character item does not belong to this character');
            }
        }

        let isOffHandShield = false;
        if (data.offHandCharacterItemId) {
            const offHandItem = await prisma.characterItem.findFirst({
                where: {
                    id: data.offHandCharacterItemId,
                    characterId: characterId,
                },
            });
            if (!offHandItem) {
                throw new Error('Off hand character item does not belong to this character');
            }
            // Check if offhand item is a shield by looking up the base item
            if (offHandItem.baseItemId) {
                const baseItem = await prisma.item.findUnique({
                    where: { id: offHandItem.baseItemId },
                    include: { armor: true },
                });
                if (baseItem?.armor?.category === ARMOR_CATEGORY_ENUM.Shield) {
                    isOffHandShield = true;
                }
            }
        }

        // Validate attack definition rules based on items
        // Dual-wield: both items required and different (shields don't count as dual-wield)
        const isDualWield = data.offHandCharacterItemId !== null && data.offHandCharacterItemId !== undefined && !isOffHandShield;
        if (isDualWield) {
            if (!data.mainHandCharacterItemId) {
                throw new Error('Dual wield requires both main hand and off hand character items');
            }
            if (data.mainHandCharacterItemId === data.offHandCharacterItemId) {
                throw new Error('Main hand and off hand items must be different');
            }
            // Dual wield cannot use slot 7 (off-hand would need slot 8)
            if (data.attackSlot === 7) {
                throw new Error('Dual wield cannot use attack slot 7 (off-hand would need slot 8)');
            }
        }

        // Validate slot conflicts
        if (data.attackSlot !== null) {
            const existingDefinitions = await prisma.characterAttackDefinition.findMany({
                where: {
                    characterId: characterId,
                    attackSlot: { not: null },
                },
            });

            // Check for slot conflicts
            for (const existing of existingDefinitions) {
                if (existing.attackSlot === data.attackSlot) {
                    throw new Error(`Attack slot ${data.attackSlot} is already occupied`);
                }
                // For dual wield, also check slot+1 (shields don't count as dual-wield)
                if (isDualWield && existing.attackSlot === data.attackSlot + 1) {
                    throw new Error(`Attack slot ${data.attackSlot + 1} is already occupied (needed for dual wield off-hand)`);
                }
                // If existing is dual wield, check if it occupies our slot
                if (existing.attackSlot !== null && data.attackSlot === existing.attackSlot + 1) {
                    // Check if existing is dual wield by checking if it has offHandCharacterItemId and is not a shield
                    // We need to check if the existing offhand is a shield
                    let existingIsDualWield = false;
                    if (existing.offHandCharacterItemId) {
                        const existingOffHandItem = await prisma.characterItem.findFirst({
                            where: { id: existing.offHandCharacterItemId },
                        });
                        if (existingOffHandItem?.baseItemId) {
                            const existingBaseItem = await prisma.item.findUnique({
                                where: { id: existingOffHandItem.baseItemId },
                                include: { armor: true },
                            });
                            // Only treat as dual-wield if it's not a shield
                            existingIsDualWield = existingBaseItem?.armor?.category !== ARMOR_CATEGORY_ENUM.Shield;
                        } else {
                            existingIsDualWield = true; // If no baseItemId, assume it's a weapon
                        }
                    }
                    if (existingIsDualWield) {
                        throw new Error(`Attack slot ${data.attackSlot} is already occupied by dual wield off-hand`);
                    }
                }
            }
        }

        const result = await prisma.characterAttackDefinition.create({
            data: {
                characterId: characterId,
                attackSlot: data.attackSlot ?? null,
                mainHandCharacterItemId: data.mainHandCharacterItemId ?? null,
                offHandCharacterItemId: data.offHandCharacterItemId ?? null,
            },
        });

        return { id: result.id.toString(), message: 'Attack definition created successfully' };
    },

    async updateCharacterAttackDefinition(characterId: number, attackId: number, data: UpdateCharacterAttackDefinitionRequest): Promise<UpdateResponse> {
        // Verify the attack definition belongs to the character
        const existing = await prisma.characterAttackDefinition.findFirst({
            where: {
                id: attackId,
                characterId: characterId,
            },
        });

        if (!existing) {
            throw new Error('Attack definition not found or does not belong to this character');
        }

        // Validate character items if provided
        if (data.mainHandCharacterItemId !== undefined && data.mainHandCharacterItemId !== null) {
            const mainHandItem = await prisma.characterItem.findFirst({
                where: {
                    id: data.mainHandCharacterItemId,
                    characterId: characterId,
                },
            });
            if (!mainHandItem) {
                throw new Error('Main hand character item does not belong to this character');
            }
        }

        let isOffHandShield = false;
        const offHandId = data.offHandCharacterItemId ?? existing.offHandCharacterItemId;
        if (offHandId !== null && offHandId !== undefined) {
            const offHandItem = await prisma.characterItem.findFirst({
                where: {
                    id: offHandId,
                    characterId: characterId,
                },
            });
            if (!offHandItem) {
                throw new Error('Off hand character item does not belong to this character');
            }
            // Check if offhand item is a shield by looking up the base item
            if (offHandItem.baseItemId) {
                const baseItem = await prisma.item.findUnique({
                    where: { id: offHandItem.baseItemId },
                    include: { armor: true },
                });
                if (baseItem?.armor?.category === ARMOR_CATEGORY_ENUM.Shield) {
                    isOffHandShield = true;
                }
            }
        }

        // Validate attack definition rules based on items
        const mainHand = data.mainHandCharacterItemId ?? existing.mainHandCharacterItemId;
        const offHand = data.offHandCharacterItemId ?? existing.offHandCharacterItemId;

        // Dual-wield: both items required and different (shields don't count as dual-wield)
        const isDualWield = offHand !== null && offHand !== undefined && !isOffHandShield;
        if (isDualWield) {
            if (!mainHand) {
                throw new Error('Dual wield requires both main hand and off hand character items');
            }
            if (mainHand === offHand) {
                throw new Error('Main hand and off hand items must be different');
            }
            // Dual wield cannot use slot 7
            const attackSlot = data.attackSlot ?? existing.attackSlot;
            if (attackSlot === 7) {
                throw new Error('Dual wield cannot use attack slot 7 (off-hand would need slot 8)');
            }
        }

        // Validate slot conflicts (excluding current definition)
        const attackSlot = data.attackSlot !== undefined ? data.attackSlot : existing.attackSlot;
        if (attackSlot !== null) {
            const existingDefinitions = await prisma.characterAttackDefinition.findMany({
                where: {
                    characterId: characterId,
                    id: { not: attackId },
                    attackSlot: { not: null },
                },
            });

            for (const other of existingDefinitions) {
                if (other.attackSlot === attackSlot) {
                    throw new Error(`Attack slot ${attackSlot} is already occupied`);
                }
                // For dual wield, also check slot+1 (shields don't count as dual-wield)
                if (isDualWield && other.attackSlot === attackSlot + 1) {
                    throw new Error(`Attack slot ${attackSlot + 1} is already occupied (needed for dual wield off-hand)`);
                }
                // If other is dual wield, check if it occupies our slot
                if (other.attackSlot !== null && attackSlot === other.attackSlot + 1) {
                    // Check if the other definition's offhand is a shield
                    let otherIsDualWield = false;
                    if (other.offHandCharacterItemId) {
                        const otherOffHandItem = await prisma.characterItem.findFirst({
                            where: { id: other.offHandCharacterItemId },
                        });
                        if (otherOffHandItem?.baseItemId) {
                            const otherBaseItem = await prisma.item.findUnique({
                                where: { id: otherOffHandItem.baseItemId },
                                include: { armor: true },
                            });
                            // Only treat as dual-wield if it's not a shield
                            otherIsDualWield = otherBaseItem?.armor?.category !== ARMOR_CATEGORY_ENUM.Shield;
                        } else {
                            otherIsDualWield = true; // If no baseItemId, assume it's a weapon
                        }
                    }
                    if (otherIsDualWield) {
                        throw new Error(`Attack slot ${attackSlot} is already occupied by dual wield off-hand`);
                    }
                }
            }
        }

        await prisma.characterAttackDefinition.update({
            where: { id: attackId },
            data: {
                attackSlot: data.attackSlot,
                mainHandCharacterItemId: data.mainHandCharacterItemId,
                offHandCharacterItemId: data.offHandCharacterItemId,
            },
        });

        return { message: 'Attack definition updated successfully' };
    },

    async deleteCharacterAttackDefinition(characterId: number, attackId: number): Promise<UpdateResponse> {
        // Verify the attack definition belongs to the character
        const existing = await prisma.characterAttackDefinition.findFirst({
            where: {
                id: attackId,
                characterId: characterId,
            },
        });

        if (!existing) {
            throw new Error('Attack definition not found or does not belong to this character');
        }

        await prisma.characterAttackDefinition.delete({
            where: { id: attackId },
        });

        return { message: 'Attack definition deleted successfully' };
    },

    async reorderCharacterAttackDefinitions(characterId: number, attackDefinitionIds: number[]): Promise<UpdateResponse> {
        // Verify all attack definitions belong to the character
        const existingDefinitions = await prisma.characterAttackDefinition.findMany({
            where: {
                characterId: characterId,
            },
        });

        const existingIds = new Set(existingDefinitions.map(def => def.id));
        for (const id of attackDefinitionIds) {
            if (!existingIds.has(id)) {
                throw new Error(`Attack definition ${id} does not belong to this character`);
            }
        }

        // Verify all IDs are provided (no missing definitions)
        if (attackDefinitionIds.length !== existingDefinitions.length) {
            throw new Error('All attack definitions must be included in reorder');
        }

        // Update slots based on order
        // Dual wield definitions take two consecutive slots
        await prisma.$transaction(async (tx) => {
            let currentSlot = 1;
            let i = 0;
            while (i < attackDefinitionIds.length) {
                const attackId = attackDefinitionIds[i];
                const definition = existingDefinitions.find(def => def.id === attackId);

                if (!definition) {
                    throw new Error(`Attack definition ${attackId} not found`);
                }

                // Check if this is dual wield (has off-hand item)
                const isDualWield = definition.offHandCharacterItemId !== null;

                if (isDualWield) {
                    // Dual wield: check if slot 7 would be needed
                    if (currentSlot === 7) {
                        throw new Error('Cannot place dual wield at slot 7 (off-hand would need slot 8)');
                    }
                    // Update main hand slot
                    await tx.characterAttackDefinition.update({
                        where: { id: attackId },
                        data: { attackSlot: currentSlot },
                    });
                    // Off-hand automatically uses currentSlot + 1, but we need to ensure no conflict
                    // The next definition should skip currentSlot + 1
                    currentSlot += 2;
                } else {
                    // Single slot attack
                    await tx.characterAttackDefinition.update({
                        where: { id: attackId },
                        data: { attackSlot: currentSlot },
                    });
                    currentSlot += 1;
                }

                i += 1;
            }

            // Set remaining definitions to null (not displayed on sheet)
            // This shouldn't happen if all definitions are in the list, but handle it anyway
            const updatedIds = new Set(attackDefinitionIds);
            const toNullify = existingDefinitions.filter(def => !updatedIds.has(def.id));
            if (toNullify.length > 0) {
                await tx.characterAttackDefinition.updateMany({
                    where: {
                        id: { in: toNullify.map(def => def.id) },
                    },
                    data: { attackSlot: null },
                });
            }
        });

        return { message: 'Attack definitions reordered successfully' };
    },

    // Gestalt character calculation functions
    async calculateCharacterStats(character: CharacterWithAllDetailsResponse): Promise<{
        isGestalt: boolean;
        totalLevel: number;
        stats: GestaltStats | null;
        errors: string[];
    }> {
        const errors: string[] = [];

        try {
            const isGestalt = isGestaltCharacter(character);
            const totalLevel = character.advancements.length;

            if (isGestalt) {
                // Validate all gestalt advancements
                for (const advancement of character.advancements) {
                    const { primary, secondary } = getGestaltClassesForLevel(advancement);
                    if (primary && secondary) {
                        const validation = validateGestaltClasses(primary, secondary);
                        if (!validation.isValid) {
                            errors.push(...validation.errors);
                        }
                    }
                }

                if (errors.length === 0) {
                    const stats = calculateGestaltCharacterStats(character);
                    return { isGestalt, totalLevel, stats, errors };
                }
            }

            return { isGestalt, totalLevel, stats: null, errors };
        } catch (error) {
            errors.push(`Failed to calculate character stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { isGestalt: false, totalLevel: 0, stats: null, errors };
        }
    },

    async calculateAdvancementStats(character: CharacterWithAllDetailsResponse, advancementLevel: number): Promise<{
        stats: GestaltStats | null;
        errors: string[];
    }> {
        const errors: string[] = [];

        try {
            const advancement = character.advancements.find(adv => adv.level === advancementLevel);
            if (!advancement) {
                errors.push(`No advancement found for level ${advancementLevel}`);
                return { stats: null, errors };
            }

            const isGestalt = isGestaltCharacter(character);
            if (isGestalt) {
                const { primary, secondary } = getGestaltClassesForLevel(advancement);
                if (primary && secondary) {
                    const validation = validateGestaltClasses(primary, secondary);
                    if (!validation.isValid) {
                        errors.push(...validation.errors);
                        return { stats: null, errors };
                    }

                    // Get ability scores for calculations
                    const conMod = character.abilityScores.find(score => score.abilityId === 1)?.value || 10; // Constitution
                    const intMod = character.abilityScores.find(score => score.abilityId === 2)?.value || 10; // Intelligence

                    const stats = calculateGestaltStats(advancement, primary, secondary, conMod, intMod);
                    return { stats, errors };
                }
            }

            return { stats: null, errors };
        } catch (error) {
            errors.push(`Failed to calculate advancement stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return { stats: null, errors };
        }
    },

    async getCharacterDomains(characterId: number, classId: number): Promise<number[]> {
        // Get all progressions for this class via many-to-many relationship
        // Domain choices can be associated with any progression for the class
        const classLinks = await prisma.featureProgressionClassMap.findMany({
            where: { classId },
            select: { progressionId: true }
        });
        const progressionIds = classLinks.map(link => link.progressionId);

        const progressions = await prisma.featureProgression.findMany({
            where: {
                id: { in: progressionIds }
            },
            select: {
                id: true
            }
        });

        const finalProgressionIds = progressions.map(p => p.id);

        if (finalProgressionIds.length === 0) {
            return [];
        }

        // Get character's feature choices where appliesTo = Domain
        // and the progression is associated with this class
        const domainChoices = await prisma.characterFeatureChoice.findMany({
            where: {
                characterId,
                progressionId: { in: progressionIds },
                featureEntity: {
                    appliesTo: EntityAppliesToType.Domain,
                }
            },
            include: {
                featureEntity: {
                    select: {
                        appliesTo: true
                    }
                }
            }
        });

        // Filter to ensure appliesTo is actually Domain and extract domain IDs
        const domainIds = Array.from(new Set(
            domainChoices
                .filter(choice => choice.featureEntity?.appliesTo === EntityAppliesToType.Domain)
                .map(choice => choice.appliesToId)
                .filter((id): id is number => id !== null)
        ));

        return domainIds;
    },

    /**
     * Get available spells for a character's class, including known status and free grant information.
     * 
     * This method handles both spellbook classes (Wizard, etc.) and spellsKnown classes (Sorcerer, Bard, etc.):
     * - **Spellbook Classes**: Detects via `EntityAppliesToType.SpellbookSpell` in resolved progressions
     *   - Calculates available free spells from resolved progressions
     *   - Checks for 0th level spell grant feature (EntityType.Other + SpellbookSpell with appliesToId: 0)
     *   - For 0th level spells, marks them as "known" if the grant feature exists (no database records)
     *   - For other spell levels, marks spells as "known" based on AdvancementSpell records
     *   - Includes `isFreeGrant` flag for each known spell
     * - **SpellsKnown Classes**: Uses AdvancementSpell records for all spell levels (including 0th)
     *   - Does not calculate free spells (uses spellsKnown progression limits instead)
     *   - All known spells come from AdvancementSpell records
     * 
     * The method also handles domain spells for classes with domains (e.g., Cleric).
     * 
     * @param characterId - The character to get spells for
     * @param classId - The class to get spells for
     * @param resolvedProgressions - Optional resolved progressions. If provided, used for spellbook class detection and free spell calculation. If not provided, queries database directly.
     * @returns Object containing:
     *   - `spells`: Array of available spells with known status and free grant flag
     *   - `domainSpells`: Array of domain spells (if character has domains)
     *   - `availableFreeSpells`: Total available free spells for spellbook classes (undefined for spellsKnown classes)
     * 
     * @see ResolvedFeatureService.getAvailableSpellbookSpells - For free spell calculation
     * @see ResolvedFeatureService.hasZeroLevelSpellbookSpellsGrant - For 0th level grant detection
     */
    async getAvailableSpellsForClass(
        characterId: number,
        classId: number,
        resolvedProgressions?: FeatureProgression[]
    ): Promise<{
        spells: Array<{ spell: Spell; classSpellLevel: number | null; isKnown: boolean; isFreeGrant?: boolean }>;
        domainSpells: Array<{ domainId: number; domainName: string; spell: Spell; spellLevel: number; classSpellLevel: number | null; isKnown: boolean }>;
        availableFreeSpells?: number;
    }> {
        // Get character
        const character = await prisma.userCharacter.findUnique({
            where: { id: characterId },
            include: {
                advancements: {
                    include: {
                        spellsKnown: {
                            select: {
                                spellId: true,
                                isFreeGrant: true
                            }
                        }
                    }
                },
                disallowedSources: {
                    select: {
                        sourceBookId: true
                    }
                },
                abilityScores: {
                    select: {
                        abilityId: true,
                        value: true
                    }
                }
            }
        });

        if (!character) {
            throw new Error('Character not found');
        }

        // Get class details
        const classDetails = await prisma.class.findUnique({
            where: { id: classId },
            select: {
                canCastSpells: true,
                spellsKnown: true,
            }
        });

        if (!classDetails || !classDetails.canCastSpells) {
            return { spells: [], domainSpells: [] };
        }

        const characterLevel = character.advancements.length;
        const disallowedSourceIds = character.disallowedSources.map(ds => ds.sourceBookId);
        const knownSpellIds = new Set(
            character.advancements.flatMap(adv => adv.spellsKnown.map(s => s.spellId))
        );

        // Get character's domains for this class
        const domainIds = await this.getCharacterDomains(characterId, classId);

        // Get domain spells if character has domains
        let domainSpells: Array<{ domainId: number; domainName: string; spell: Spell; spellLevel: number; classSpellLevel: number | null; isKnown: boolean }> = [];
        if (domainIds.length > 0) {
            const domainSpellData = await spellService.getDomainSpells(domainIds, characterLevel, classId);

            domainSpells = domainSpellData.map(ds => {
                // Filter by source restrictions
                const spellSourceIds = ds.spell.sourceBookInfo?.map(sb => sb.sourceBookId) || [];
                const isDisallowed = spellSourceIds.some(sid => disallowedSourceIds.includes(sid));

                if (isDisallowed) {
                    return null;
                }

                return {
                    domainId: ds.domainId,
                    domainName: ds.domainName,
                    spell: ds.spell,
                    spellLevel: ds.spellLevel,
                    classSpellLevel: ds.classSpellLevel,
                    isKnown: knownSpellIds.has(ds.spell.id)
                };
            }).filter((ds): ds is NonNullable<typeof ds> => ds !== null);
        }

        // Check if this is a spellbook class (has EntityAppliesToType.SpellbookSpell in resolved progressions or database)
        let isSpellbookClass = false;
        let availableFreeSpells: number | undefined = undefined;
        let hasZeroLevelGrant = false;

        if (resolvedProgressions) {
            for (const progression of resolvedProgressions) {
                // Check if this progression applies to the class via many-to-many relationship
                const appliesToClass = progression.classes && progression.classes.some(c => c.classId === classId);

                if (appliesToClass && progression.entities) {
                    for (const entity of progression.entities) {
                        if (entity.type === EntityType.Choice &&
                            entity.appliesTo === EntityAppliesToType.SpellbookSpell) {
                            isSpellbookClass = true;
                            break;
                        }
                    }
                    if (isSpellbookClass) break;
                }
            }

            // Calculate available free spells for spellbook classes
            if (isSpellbookClass) {
                availableFreeSpells = ResolvedFeatureService.getAvailableSpellbookSpells(
                    resolvedProgressions,
                    characterLevel,
                    classId,
                    character as CharacterWithAllDetailsResponse
                );

                // Check if 0th level spells are granted via feature
                hasZeroLevelGrant = ResolvedFeatureService.hasZeroLevelSpellbookSpellsGrant(
                    resolvedProgressions,
                    classId
                );
            }
        } else {
            // If resolved progressions are not provided, check database directly via many-to-many relationship
            // First, find progressions linked to this class
            const classLinks = await prisma.featureProgressionClassMap.findMany({
                where: { classId },
                select: { progressionId: true }
            });
            const progressionIds = classLinks.map(link => link.progressionId);

            if (progressionIds.length > 0) {
                // Check for spellbook class (EntityType.Other + SpellbookSpell)
                const spellbookProgression = await prisma.featureEntity.findFirst({
                    where: {
                        progressionId: { in: progressionIds },
                        featureProgression: {
                            level: { lte: characterLevel }
                        },
                        type: EntityType.Other,
                        appliesTo: EntityAppliesToType.SpellbookSpell
                    }
                });

                if (spellbookProgression) {
                    isSpellbookClass = true;
                }

                // Check for 0th level spell grant (EntityType.Other + SpellbookSpell + appliesToId: 0 + appliesToSubId: -1)
                const zeroLevelGrantEntity = await prisma.featureEntity.findFirst({
                    where: {
                        progressionId: { in: progressionIds },
                        featureProgression: {
                            level: { lte: characterLevel }
                        },
                        type: EntityType.Other,
                        appliesTo: EntityAppliesToType.SpellbookSpell,
                        appliesToId: 0,
                        appliesToSubId: -1
                    }
                });

                if (zeroLevelGrantEntity) {
                    hasZeroLevelGrant = true;
                }
            }
        }

        // Get spells for this class
        let spells: Array<{ spell: Spell; classSpellLevel: number | null; isKnown: boolean; isFreeGrant?: boolean }> = [];

        // Build map of spellId -> isFreeGrant for known spells
        const spellFreeGrantMap = new Map<number, boolean>();
        for (const advancement of character.advancements) {
            for (const spellKnown of advancement.spellsKnown) {
                spellFreeGrantMap.set(spellKnown.spellId, spellKnown.isFreeGrant);
            }
        }

        if (classDetails.spellsKnown && !isSpellbookClass) {
            // For spellsKnown classes (Sorcerer, Bard, etc.), get spells from AdvancementSpell
            // This includes 0th level spells that players have selected
            const knownSpells = await prisma.advancementSpell.findMany({
                where: {
                    advancement: {
                        characterId,
                        classId
                    }
                },
                include: {
                    spell: {
                        include: {
                            levelMapping: {
                                where: { classId },
                                select: {
                                    classId: true,
                                    level: true
                                }
                            },
                            descriptorIds: {
                                select: {
                                    descriptorId: true
                                }
                            },
                            schoolIds: {
                                select: {
                                    schoolId: true
                                }
                            },
                            subSchoolIds: {
                                select: {
                                    subSchoolId: true
                                }
                            },
                            componentIds: {
                                select: {
                                    componentId: true
                                }
                            },
                            sourceBookInfo: {
                                select: {
                                    sourceBookId: true,
                                    pageNumber: true,
                                    sourceBook: {
                                        select: {
                                            id: true,
                                            abbreviation: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            spells = knownSpells.map(as => {
                const spellSourceIds = as.spell.sourceBookInfo?.map(sb => sb.sourceBookId) || [];
                const isDisallowed = spellSourceIds.some(sid => disallowedSourceIds.includes(sid));

                if (isDisallowed) {
                    return null;
                }

                return {
                    spell: as.spell,
                    classSpellLevel: as.spell.levelMapping[0]?.level ?? null,
                    isKnown: true,
                    isFreeGrant: as.isFreeGrant
                };
            }).filter((s): s is NonNullable<typeof s> => s !== null);
        } else if (isSpellbookClass) {
            // For spellbook classes, query all spells from SpellLevelMap
            // 0th level spells are marked as known if the grant feature exists
            // Non-0th level spells come from AdvancementSpell
            const spellLevelMappings = await prisma.spellLevelMap.findMany({
                where: {
                    classId,
                    level: { lte: characterLevel }
                },
                include: {
                    spell: {
                        include: {
                            levelMapping: {
                                where: { classId },
                                select: {
                                    classId: true,
                                    level: true
                                }
                            },
                            descriptorIds: {
                                select: {
                                    descriptorId: true
                                }
                            },
                            schoolIds: {
                                select: {
                                    schoolId: true
                                }
                            },
                            subSchoolIds: {
                                select: {
                                    subSchoolId: true
                                }
                            },
                            componentIds: {
                                select: {
                                    componentId: true
                                }
                            },
                            sourceBookInfo: {
                                select: {
                                    sourceBookId: true,
                                    pageNumber: true,
                                    sourceBook: {
                                        select: {
                                            id: true,
                                            abbreviation: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            spells = spellLevelMappings.map(slm => {
                const spellSourceIds = slm.spell.sourceBookInfo?.map(sb => sb.sourceBookId) || [];
                const isDisallowed = spellSourceIds.some(sid => disallowedSourceIds.includes(sid));

                if (isDisallowed) {
                    return null;
                }

                // For 0th level spells: mark as known if grant feature exists
                // For non-0th level spells: check AdvancementSpell records
                const isZeroLevel = slm.level === 0;
                let isKnown: boolean;
                let isFreeGrant: boolean | undefined = undefined;

                if (isZeroLevel && hasZeroLevelGrant) {
                    // 0th level spell with grant feature - always known (no database record)
                    isKnown = true;
                    isFreeGrant = true; // These are free grants via feature
                } else {
                    // Non-0th level spell or 0th level without grant - check AdvancementSpell
                    isKnown = knownSpellIds.has(slm.spell.id);
                    isFreeGrant = isKnown ? spellFreeGrantMap.get(slm.spell.id) : undefined;
                }

                return {
                    spell: slm.spell,
                    classSpellLevel: slm.level,
                    isKnown,
                    isFreeGrant
                };
            }).filter((s): s is NonNullable<typeof s> => s !== null);
        } else {
            // For non-spellsKnown classes, get all available spells from SpellLevelMap
            const spellLevelMappings = await prisma.spellLevelMap.findMany({
                where: {
                    classId,
                    level: { lte: characterLevel }
                },
                include: {
                    spell: {
                        include: {
                            levelMapping: {
                                where: { classId },
                                select: {
                                    classId: true,
                                    level: true
                                }
                            },
                            descriptorIds: {
                                select: {
                                    descriptorId: true
                                }
                            },
                            schoolIds: {
                                select: {
                                    schoolId: true
                                }
                            },
                            subSchoolIds: {
                                select: {
                                    subSchoolId: true
                                }
                            },
                            componentIds: {
                                select: {
                                    componentId: true
                                }
                            },
                            sourceBookInfo: {
                                select: {
                                    sourceBookId: true,
                                    pageNumber: true,
                                    sourceBook: {
                                        select: {
                                            id: true,
                                            abbreviation: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            spells = spellLevelMappings.map(slm => {
                const spellSourceIds = slm.spell.sourceBookInfo?.map(sb => sb.sourceBookId) || [];
                const isDisallowed = spellSourceIds.some(sid => disallowedSourceIds.includes(sid));

                if (isDisallowed) {
                    return null;
                }

                const isKnown = knownSpellIds.has(slm.spell.id);
                return {
                    spell: slm.spell,
                    classSpellLevel: slm.level,
                    isKnown,
                    isFreeGrant: isKnown ? spellFreeGrantMap.get(slm.spell.id) : undefined
                };
            }).filter((s): s is NonNullable<typeof s> => s !== null);
        }

        return {
            spells,
            domainSpells,
            ...(availableFreeSpells !== undefined && { availableFreeSpells })
        };
    },

    /**
     * Get the maximum spell level a class can cast at a given character level.
     * 
     * Determines the highest spell level that has spell slots available at the specified
     * character level. This is used for validation when scribing spells to ensure a character
     * cannot scribe spells beyond their casting capability.
     * 
     * @param classId - The class to check spellcasting progression for
     * @param characterLevel - The character level to check maximum castable spell level at
     * @returns The highest spell level with available slots at the given level, or 0 if the class
     *          has no spellcasting progression or no slots at that level
     * 
     * @example
     * // A 1st-level wizard can cast 1st-level spells (returns 1)
     * // A 3rd-level wizard can cast 2nd-level spells (returns 2)
     * // A 5th-level wizard can cast 3rd-level spells (returns 3)
     */
    async getMaxCastableSpellLevel(classId: number, characterLevel: number): Promise<number> {
        // Phase 3: Support both old (direct classId) and new (featureProgressionId) patterns
        // Try new pattern first (feature-based spellcasting)
        const featureProgressions = await featureSystemService.getFeatureProgressionsByClassId(classId);

        // Extract spellcasting progression IDs from feature entities
        const spellcastingProgressionIds: number[] = [];
        for (const progression of featureProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    if (entity.appliesTo === EntityAppliesToType.SpellcastingProgression &&
                        entity.appliesToId !== null &&
                        typeof entity.appliesToId === 'number') {
                        spellcastingProgressionIds.push(entity.appliesToId);
                    }
                }
            }
        }

        let maxSpellLevel = 0;

        if (spellcastingProgressionIds.length > 0) {
            // New pattern: Get spellcasting from FeatureProgression entities
            const progressions = await prisma.spellcastingProgression.findMany({
                where: {
                    id: { in: spellcastingProgressionIds },
                    classLevel: { lte: characterLevel }
                },
                include: {
                    slots: true
                },
                orderBy: {
                    classLevel: 'desc'
                },
                take: 1
            });

            if (progressions.length > 0 && progressions[0].slots && progressions[0].slots.length > 0) {
                maxSpellLevel = Math.max(...progressions[0].slots.map(slot => slot.spellLevel));
            }
        } else {
            // Fallback to old pattern: Direct classId link (backward compatibility)
            const classDetails = await prisma.class.findUnique({
                where: { id: classId },
                include: {
                    spellcastingProgression: {
                        where: {
                            classLevel: { lte: characterLevel }
                        },
                        include: {
                            slots: true
                        },
                        orderBy: {
                            classLevel: 'desc'
                        },
                        take: 1
                    }
                }
            });

            if (classDetails?.spellcastingProgression && classDetails.spellcastingProgression.length > 0) {
                const progression = classDetails.spellcastingProgression[0];
                if (progression.slots && progression.slots.length > 0) {
                    maxSpellLevel = Math.max(...progression.slots.map(slot => slot.spellLevel));
                }
            }
        }

        return maxSpellLevel;
    },

    /**
     * Validate that a spell level can be cast at a given advancement level.
     * 
     * Ensures that a character can only scribe spells up to the maximum castable spell level
     * at their advancement level. This validation applies to both free grants and ad-hoc
     * scribing - a 1st-level wizard cannot scribe a 3rd-level spell, regardless of whether
     * it's a free grant or found on a scroll.
     * 
     * @param classId - The class to check spellcasting progression for
     * @param advancementLevel - The character level at the time of the advancement
     * @param spellLevel - The spell level to validate
     * @returns True if the spell level is castable at the advancement level, false otherwise
     * 
     * @see getMaxCastableSpellLevel - For the underlying calculation
     */
    async validateSpellLevelForAdvancement(classId: number, advancementLevel: number, spellLevel: number): Promise<boolean> {
        const maxCastableLevel = await this.getMaxCastableSpellLevel(classId, advancementLevel);
        return spellLevel <= maxCastableLevel;
    },

    /**
     * Count free grants (isFreeGrant: true) for a specific advancement.
     * 
     * Counts the number of spells that were granted for free during level-up for a specific
     * advancement. This is used to validate that a character hasn't exceeded their free
     * spell grant limit when adding spells during level-up.
     * 
     * @param advancementId - The advancement to count free grants for
     * @returns The number of free grant spells (isFreeGrant: true) for this advancement
     * 
     * @see addSpellKnown - Uses this to validate free grant limits
     * @see ResolvedFeatureService.getAvailableSpellbookSpells - For calculating total available free spells
     */
    async countFreeGrantsForAdvancement(advancementId: number): Promise<number> {
        const count = await prisma.advancementSpell.count({
            where: {
                advancementId,
                isFreeGrant: true
            }
        });
        return count;
    },

    /**
     * Adds a spell to a character's spellbook or known spells.
     * 
     * This method integrates with the character resolution session system:
     * - Updates the database with the new spell
     * - If an active resolution session exists, updates the session with the new character state
     * - Re-resolves character features to reflect the spell addition
     * - Returns updated resolved character data in the response
     * 
     * For spellbook classes (wizards, etc.), validates free spell grants using resolved progressions.
     * For spellsKnown classes (sorcerers, bards), validates maximum spells per level.
     * 
     * @param characterId - The character receiving the spell. Must belong to an existing character record.
     * @param classId - The class for spell level validation. Determines maximum castable spell level at the advancement level.
     * @param spellId - The spell to add. Must be available for the specified class via SpellLevelMap.
     * @param advancementId - The advancement record to associate the spell with. Must belong to the character and class.
     * @param isFreeGrant - Whether this is a free grant (spellbook classes during level-up) or ad-hoc scribing. Affects validation limits.
     * @param resolvedProgressions - Optional resolved progressions for validation. If not provided and session exists, fetched from session. If no session, resolved on-demand.
     * @returns Response with spell counts (for free grants) and updated resolved character data (if session exists)
     * @throws Error if spell cannot be added (validation failed, limit reached, spell not available for class, etc.)
     * 
     * @see CharacterSessionService - For session management
     * @see CharacterResolutionService - For feature resolution
     * @see ResolvedFeatureService.getAvailableSpellbookSpells - For free spell calculation
     */
    async addSpellKnown(
        characterId: number,
        classId: number,
        spellId: number,
        advancementId: number,
        isFreeGrant: boolean = false,
        resolvedProgressions?: FeatureProgression[]
    ): Promise<AddSpellKnownResponse> {
        // Verify advancement belongs to character and class
        const advancement = await prisma.characterAdvancement.findFirst({
            where: {
                id: advancementId,
                characterId,
                classId
            }
        });

        if (!advancement) {
            throw new Error('Advancement not found or does not belong to character/class');
        }

        // Get spell level for this class
        const spellLevelMapping = await prisma.spellLevelMap.findFirst({
            where: {
                spellId,
                classId
            }
        });

        if (!spellLevelMapping) {
            throw new Error('Spell is not available for this class');
        }

        const spellLevel = spellLevelMapping.level;

        // ALWAYS validate spell level (for both free grants and ad-hoc scribing)
        const isValidSpellLevel = await this.validateSpellLevelForAdvancement(classId, advancement.level, spellLevel);
        if (!isValidSpellLevel) {
            const maxCastableLevel = await this.getMaxCastableSpellLevel(classId, advancement.level);
            throw new Error(`Cannot scribe ${spellLevel} level spell at character level ${advancement.level}. Maximum castable level is ${maxCastableLevel}`);
        }

        // When isFreeGrant: true, also validate quantity limit
        // Declare variables outside the block so they're accessible in the response section
        let characterForValidation: CharacterWithAllDetailsResponse | null = null;
        let effectiveResolvedProgressionsForValidation: FeatureProgression[] | undefined = resolvedProgressions;

        if (isFreeGrant) {
            // Get character with all details for resolved progressions calculation
            characterForValidation = await this.getCharacterWithAllDetails({ id: characterId });
            if (!characterForValidation) {
                throw new Error('Character not found');
            }

            // Try to get resolved progressions from session first (if character is being edited)
            if (!effectiveResolvedProgressionsForValidation && characterForValidation.userId) {
                const sessionService = new CharacterSessionService();
                const session = await sessionService.getSession(characterId, characterForValidation.userId);
                if (session?.resolvedResult?.resolvedProgressions) {
                    effectiveResolvedProgressionsForValidation = session.resolvedResult.resolvedProgressions;
                }
            }

            // Fetch resolved progressions if not provided and not available from session
            if (!effectiveResolvedProgressionsForValidation) {
                // Load race and class details for resolution
                const raceDetails = characterForValidation.raceId ? await raceService.getRaceById({ id: characterForValidation.raceId }) : null;
                const classDetails = classId ? await classService.getClassById({ id: classId }) : null;

                // Find secondary class if this is a gestalt advancement
                const advancementForResolution = characterForValidation.advancements?.find(adv => adv.id === advancementId);
                const secondaryClassDetails = advancementForResolution?.secondaryClassId
                    ? await classService.getClassById({ id: advancementForResolution.secondaryClassId })
                    : null;

                // Build initial context without user choices for first pass
                const initialContext: ResolutionContext = {
                    character: characterForValidation,
                    targetLevel: advancement.level,
                    advancement: advancementForResolution,
                    raceDetails,
                    classDetails: classDetails ?? null,
                    secondaryClassDetails: secondaryClassDetails ?? null,
                    isGestalt: !!secondaryClassDetails,
                    userChoices: undefined,
                    includePendingChoices: false,
                    resolveCascading: false,
                    maxResolutionDepth: 10,
                };

                // First pass: Resolve base features to get progressions
                const firstPassResult = await CharacterResolutionService.resolveCharacterFeatures(
                    characterForValidation,
                    advancement.level,
                    initialContext
                );

                // Extract user choices from character feature choices
                const userChoices: UserChoices = {};
                if (characterForValidation.advancements) {
                    for (const adv of characterForValidation.advancements) {
                        if (adv.featureChoices) {
                            for (const choice of adv.featureChoices) {
                                // Find the entity in resolved progressions to get appliesTo type
                                for (const progression of firstPassResult.resolvedProgressions) {
                                    if (progression.id === choice.progressionId && progression.entities) {
                                        const entity = progression.entities.find(e => e.id === choice.featureEntityId);
                                        if (entity && choice.appliesToId) {
                                            const appliesToType = entity.appliesTo;
                                            if (!userChoices[appliesToType]) {
                                                userChoices[appliesToType] = [];
                                            }
                                            if (!userChoices[appliesToType].includes(choice.appliesToId)) {
                                                userChoices[appliesToType].push(choice.appliesToId);
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Second pass: Resolve with user choices included
                const finalContext: ResolutionContext = {
                    character: characterForValidation,
                    targetLevel: advancement.level,
                    advancement: advancementForResolution,
                    raceDetails,
                    classDetails: classDetails ?? null,
                    secondaryClassDetails: secondaryClassDetails ?? null,
                    isGestalt: !!secondaryClassDetails,
                    userChoices: Object.keys(userChoices).length > 0 ? userChoices : undefined,
                    includePendingChoices: false,
                    resolveCascading: true,
                    maxResolutionDepth: 10,
                };

                // Resolve character features with user choices
                const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
                    characterForValidation,
                    advancement.level,
                    finalContext
                );

                effectiveResolvedProgressionsForValidation = resolutionResult.resolvedProgressions;
            }

            // Calculate available free spells for this advancement level
            const availableFreeSpells = ResolvedFeatureService.getAvailableSpellbookSpells(
                effectiveResolvedProgressionsForValidation,
                advancement.level,
                classId,
                characterForValidation
            );

            // Count existing free grants for this advancement
            const freeSpellsUsed = await this.countFreeGrantsForAdvancement(advancementId);

            if (freeSpellsUsed >= availableFreeSpells) {
                throw new Error(`Maximum free spells reached for this level. Available: ${availableFreeSpells}, Used: ${freeSpellsUsed}`);
            }
        }

        // Check if spell is already known
        const existing = await prisma.advancementSpell.findUnique({
            where: {
                advancementId_spellId: {
                    advancementId,
                    spellId
                }
            }
        });

        if (existing) {
            return { message: 'Spell already known' };
        }

        // Add spell to AdvancementSpell with isFreeGrant flag
        await prisma.advancementSpell.create({
            data: {
                advancementId,
                spellId,
                isFreeGrant
            }
        });

        // Get updated character with the new spell
        const updatedCharacter = await this.getCharacterWithAllDetails({ id: characterId });
        if (!updatedCharacter) {
            throw new Error('Character not found after adding spell');
        }

        // Check for active resolution session
        const sessionService = new CharacterSessionService();
        let resolvedCharacterResult: ResolvedCharacterResult | undefined;

        if (updatedCharacter.userId) {
            const session = await sessionService.getSession(characterId, updatedCharacter.userId);

            if (session) {
                // Re-resolve features with updated character state
                const advancementForResolution = updatedCharacter.advancements?.find(adv => adv.id === advancementId);
                const raceDetails = updatedCharacter.raceId ? await raceService.getRaceById({ id: updatedCharacter.raceId }) : null;
                const classDetails = classId ? await classService.getClassById({ id: classId }) : null;
                const secondaryClassDetails = advancementForResolution?.secondaryClassId
                    ? await classService.getClassById({ id: advancementForResolution.secondaryClassId })
                    : null;

                // Extract user choices from character feature choices
                const userChoices: UserChoices = {};
                if (updatedCharacter.advancements) {
                    for (const adv of updatedCharacter.advancements) {
                        if (adv.featureChoices) {
                            for (const choice of adv.featureChoices) {
                                // Find the entity in resolved progressions to get appliesTo type
                                if (session.resolvedResult?.resolvedProgressions) {
                                    for (const progression of session.resolvedResult.resolvedProgressions) {
                                        if (progression.id === choice.progressionId && progression.entities) {
                                            const entity = progression.entities.find(e => e.id === choice.featureEntityId);
                                            if (entity && choice.appliesToId) {
                                                const appliesToType = entity.appliesTo;
                                                if (!userChoices[appliesToType]) {
                                                    userChoices[appliesToType] = [];
                                                }
                                                if (!userChoices[appliesToType].includes(choice.appliesToId)) {
                                                    userChoices[appliesToType].push(choice.appliesToId);
                                                }
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Build resolution context
                const context: ResolutionContext = {
                    character: updatedCharacter,
                    targetLevel: advancement.level,
                    advancement: advancementForResolution,
                    raceDetails,
                    classDetails: classDetails ?? null,
                    secondaryClassDetails: secondaryClassDetails ?? null,
                    isGestalt: !!secondaryClassDetails,
                    userChoices: Object.keys(userChoices).length > 0 ? userChoices : undefined,
                    includePendingChoices: true,
                    resolveCascading: true,
                    maxResolutionDepth: 10,
                };

                // Re-resolve features
                const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
                    updatedCharacter,
                    advancement.level,
                    context
                );

                // Rebuild CharacterEditState from updated character
                const updatedCharacterState = buildCharacterEditState(
                    updatedCharacter,
                    advancement.level,
                    !!secondaryClassDetails
                );

                // Build ResolvedCharacterResult
                const classSkills = ResolvedFeatureService.getClassSkills(resolutionResult.resolvedProgressions);
                const skillBonuses = await ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
                const grantedFeats = ResolvedFeatureService.getGrantedFeats(resolutionResult.resolvedProgressions);

                // Calculate class levels for available feats
                const classLevels = new Map<number, number>();
                if (updatedCharacter.advancements) {
                    for (const adv of updatedCharacter.advancements) {
                        const currentLevel = classLevels.get(adv.classId) ?? 0;
                        classLevels.set(adv.classId, currentLevel + 1);
                        if (adv.secondaryClassId) {
                            const secondaryLevel = classLevels.get(adv.secondaryClassId) ?? 0;
                            classLevels.set(adv.secondaryClassId, secondaryLevel + 1);
                        }
                    }
                }

                const availableFeatsCount = ResolvedFeatureService.getAvailableFeatsCount(
                    resolutionResult.resolvedProgressions,
                    advancement.level,
                    classLevels
                );
                const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
                    resolutionResult.resolvedProgressions
                );

                // Calculate qualified feats (list of feats the character qualifies for)
                const allFeatsResponse = await featService.getAllFeats();
                const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
                    updatedCharacter,
                    resolutionResult.resolvedProgressions,
                    classDetails,
                    raceDetails,
                    allFeatsResponse.results
                );

                const resolvedCharacterResultForSession: ResolvedCharacterResult = {
                    resolvedProgressions: resolutionResult.resolvedProgressions,
                    pendingChoices: resolutionResult.pendingChoices,
                    classSkills,
                    skillBonuses,
                    grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
                    availableFeatsCount,
                    availableFighterBonusFeats,
                    qualifiedFeats,
                    warnings: resolutionResult.warnings,
                    errors: resolutionResult.errors,
                    sessionId: session.id,
                };

                // Update session with new resolved result and character state
                await sessionService.updateSession(session.sessionKey, updatedCharacterState, resolvedCharacterResultForSession);

                resolvedCharacterResult = resolvedCharacterResultForSession;
            }
        }

        // Build response with free spell counts if this was a free grant
        // Note: Backend updates resolution session automatically, but does not return resolvedCharacter
        // Frontend should call resolution.refreshState() to refresh resolution state
        const response: AddSpellKnownResponse = {
            message: 'Spell added successfully'
        };

        if (isFreeGrant && characterForValidation) {
            // Use the character and resolved progressions from validation (already fetched)
            let effectiveResolvedProgressions = effectiveResolvedProgressionsForValidation;
            const characterForResponse = characterForValidation;

            // If we still don't have resolved progressions, fetch them now
            if (!effectiveResolvedProgressions) {
                // Load race and class details for resolution
                const raceDetails = characterForResponse.raceId ? await raceService.getRaceById({ id: characterForResponse.raceId }) : null;
                const classDetails = classId ? await classService.getClassById({ id: classId }) : null;

                // Find secondary class if this is a gestalt advancement
                const advancementForResolution = characterForResponse.advancements?.find(adv => adv.id === advancementId);
                const secondaryClassDetails = advancementForResolution?.secondaryClassId
                    ? await classService.getClassById({ id: advancementForResolution.secondaryClassId })
                    : null;

                // Build initial context without user choices for first pass
                const initialContext: ResolutionContext = {
                    character: characterForResponse,
                    targetLevel: advancement.level,
                    advancement: advancementForResolution,
                    raceDetails,
                    classDetails: classDetails ?? null,
                    secondaryClassDetails: secondaryClassDetails ?? null,
                    isGestalt: !!secondaryClassDetails,
                    userChoices: undefined,
                    includePendingChoices: false,
                    resolveCascading: false,
                    maxResolutionDepth: 10,
                };

                // First pass: Resolve base features to get progressions
                const firstPassResult = await CharacterResolutionService.resolveCharacterFeatures(
                    characterForResponse,
                    advancement.level,
                    initialContext
                );

                // Extract user choices from character feature choices
                const userChoices: UserChoices = {};
                if (characterForResponse.advancements) {
                    for (const adv of characterForResponse.advancements) {
                        if (adv.featureChoices) {
                            for (const choice of adv.featureChoices) {
                                // Find the entity in resolved progressions to get appliesTo type
                                for (const progression of firstPassResult.resolvedProgressions) {
                                    if (progression.id === choice.progressionId && progression.entities) {
                                        const entity = progression.entities.find(e => e.id === choice.featureEntityId);
                                        if (entity && choice.appliesToId) {
                                            const appliesToType = entity.appliesTo;
                                            if (!userChoices[appliesToType]) {
                                                userChoices[appliesToType] = [];
                                            }
                                            if (!userChoices[appliesToType].includes(choice.appliesToId)) {
                                                userChoices[appliesToType].push(choice.appliesToId);
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Second pass: Resolve with user choices included
                const finalContext: ResolutionContext = {
                    character: characterForResponse,
                    targetLevel: advancement.level,
                    advancement: advancementForResolution,
                    raceDetails,
                    classDetails: classDetails ?? null,
                    secondaryClassDetails: secondaryClassDetails ?? null,
                    isGestalt: !!secondaryClassDetails,
                    userChoices: Object.keys(userChoices).length > 0 ? userChoices : undefined,
                    includePendingChoices: false,
                    resolveCascading: true,
                    maxResolutionDepth: 10,
                };

                // Resolve character features with user choices
                const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
                    characterForResponse,
                    advancement.level,
                    finalContext
                );

                effectiveResolvedProgressions = resolutionResult.resolvedProgressions;
            }

            // Calculate available free spells for this advancement level
            const availableFreeSpells = ResolvedFeatureService.getAvailableSpellbookSpells(
                effectiveResolvedProgressions!,
                advancement.level,
                classId,
                characterForResponse!
            );

            // Count free grants for this advancement (including the one we just added)
            const freeSpellsUsed = await this.countFreeGrantsForAdvancement(advancementId);
            const remainingFreeSpells = availableFreeSpells - freeSpellsUsed;

            response.freeSpellsUsed = freeSpellsUsed;
            response.availableFreeSpells = availableFreeSpells;
            response.remainingFreeSpells = Math.max(0, remainingFreeSpells);
        }

        return response;
    },

    /**
     * Removes a spell from a character's spellbook or known spells.
     * 
     * This method integrates with the character resolution session system:
     * - Removes the spell from the database
     * - If an active resolution session exists, updates the session with the new character state
     * - Re-resolves character features to reflect the spell removal
     * - Returns updated resolved character data in the response
     * 
     * If the removed spell was a free grant, updates the free spells count in the response.
     * The method rebuilds the complete CharacterEditState from the updated character before
     * updating the session to ensure all required fields are populated.
     * 
     * @param characterId - The character losing the spell. Must belong to an existing character record.
     * @param spellId - The spell to remove. Must exist in the character's AdvancementSpell records.
     * @param advancementId - The advancement record the spell is associated with. Used to identify which advancement's spell count to update.
     * @returns Response with updated spell counts (if removed spell was a free grant) and resolved character data (if session exists)
     * @throws Error if spell cannot be removed (not found, advancement doesn't belong to character, etc.)
     * 
     * @see CharacterSessionService - For session management
     * @see CharacterResolutionService - For feature resolution
     * @see addSpellKnown - For adding spells (complementary method)
     */
    async removeSpellKnown(characterId: number, spellId: number, advancementId: number): Promise<RemoveSpellKnownResponse> {
        // Verify advancement belongs to character and get the spell to check if it was a free grant
        const advancement = await prisma.characterAdvancement.findFirst({
            where: {
                id: advancementId,
                characterId
            },
            include: {
                spellsKnown: {
                    where: {
                        spellId
                    }
                }
            }
        });

        if (!advancement) {
            throw new Error('Advancement not found or does not belong to character');
        }

        // Check if the spell being removed was a free grant
        const spellToRemove = advancement.spellsKnown[0];
        const wasFreeGrant = spellToRemove?.isFreeGrant ?? false;

        // Remove spell from AdvancementSpell
        await prisma.advancementSpell.delete({
            where: {
                advancementId_spellId: {
                    advancementId,
                    spellId
                }
            }
        });

        // Get updated character without the removed spell
        const updatedCharacter = await this.getCharacterWithAllDetails({ id: characterId });
        if (!updatedCharacter) {
            throw new Error('Character not found after removing spell');
        }

        // Check for active resolution session
        const sessionService = new CharacterSessionService();
        let resolvedCharacterResult: ResolvedCharacterResult | undefined;

        if (updatedCharacter.userId) {
            const session = await sessionService.getSession(characterId, updatedCharacter.userId);

            if (session) {
                // Re-resolve features with updated character state
                const classId = advancement.classId;
                const advancementForResolution = updatedCharacter.advancements?.find(adv => adv.id === advancementId);
                const raceDetails = updatedCharacter.raceId ? await raceService.getRaceById({ id: updatedCharacter.raceId }) : null;
                const classDetails = classId ? await classService.getClassById({ id: classId }) : null;
                const secondaryClassDetails = advancementForResolution?.secondaryClassId
                    ? await classService.getClassById({ id: advancementForResolution.secondaryClassId })
                    : null;

                // Extract user choices from character feature choices
                const userChoices: UserChoices = {};
                if (updatedCharacter.advancements) {
                    for (const adv of updatedCharacter.advancements) {
                        if (adv.featureChoices) {
                            for (const choice of adv.featureChoices) {
                                // Find the entity in resolved progressions to get appliesTo type
                                if (session.resolvedResult?.resolvedProgressions) {
                                    for (const progression of session.resolvedResult.resolvedProgressions) {
                                        if (progression.id === choice.progressionId && progression.entities) {
                                            const entity = progression.entities.find(e => e.id === choice.featureEntityId);
                                            if (entity && choice.appliesToId) {
                                                const appliesToType = entity.appliesTo;
                                                if (!userChoices[appliesToType]) {
                                                    userChoices[appliesToType] = [];
                                                }
                                                if (!userChoices[appliesToType].includes(choice.appliesToId)) {
                                                    userChoices[appliesToType].push(choice.appliesToId);
                                                }
                                                break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Build resolution context
                const context: ResolutionContext = {
                    character: updatedCharacter,
                    targetLevel: advancement.level,
                    advancement: advancementForResolution,
                    raceDetails,
                    classDetails: classDetails ?? null,
                    secondaryClassDetails: secondaryClassDetails ?? null,
                    isGestalt: !!secondaryClassDetails,
                    userChoices: Object.keys(userChoices).length > 0 ? userChoices : undefined,
                    includePendingChoices: true,
                    resolveCascading: true,
                    maxResolutionDepth: 10,
                };

                // Re-resolve features
                const resolutionResult = await CharacterResolutionService.resolveCharacterFeatures(
                    updatedCharacter,
                    advancement.level,
                    context
                );

                // Rebuild CharacterEditState from updated character
                const updatedCharacterState = buildCharacterEditState(
                    updatedCharacter,
                    advancement.level,
                    !!secondaryClassDetails
                );

                // Build ResolvedCharacterResult
                const classSkills = ResolvedFeatureService.getClassSkills(resolutionResult.resolvedProgressions);
                const skillBonuses = await ResolvedFeatureService.getSkillBonuses(resolutionResult.resolvedProgressions);
                const grantedFeats = ResolvedFeatureService.getGrantedFeats(resolutionResult.resolvedProgressions);

                // Calculate class levels for available feats
                const classLevels = new Map<number, number>();
                if (updatedCharacter.advancements) {
                    for (const adv of updatedCharacter.advancements) {
                        const currentLevel = classLevels.get(adv.classId) ?? 0;
                        classLevels.set(adv.classId, currentLevel + 1);
                        if (adv.secondaryClassId) {
                            const secondaryLevel = classLevels.get(adv.secondaryClassId) ?? 0;
                            classLevels.set(adv.secondaryClassId, secondaryLevel + 1);
                        }
                    }
                }

                const availableFeatsCount = ResolvedFeatureService.getAvailableFeatsCount(
                    resolutionResult.resolvedProgressions,
                    advancement.level,
                    classLevels
                );
                const availableFighterBonusFeats = ResolvedFeatureService.getAvailableFighterBonusFeats(
                    resolutionResult.resolvedProgressions
                );

                // Calculate qualified feats (list of feats the character qualifies for)
                const allFeatsResponse = await featService.getAllFeats();
                const qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
                    updatedCharacter,
                    resolutionResult.resolvedProgressions,
                    classDetails,
                    raceDetails,
                    allFeatsResponse.results
                );

                const resolvedCharacterResultForSession: ResolvedCharacterResult = {
                    resolvedProgressions: resolutionResult.resolvedProgressions,
                    pendingChoices: resolutionResult.pendingChoices,
                    classSkills,
                    skillBonuses,
                    grantedFeats: grantedFeats.map(f => f.appliesToId!).filter((id): id is number => id !== null),
                    availableFeatsCount,
                    availableFighterBonusFeats,
                    qualifiedFeats,
                    warnings: resolutionResult.warnings,
                    errors: resolutionResult.errors,
                    sessionId: session.id,
                };

                // Update session with new resolved result and character state
                await sessionService.updateSession(session.sessionKey, updatedCharacterState, resolvedCharacterResultForSession);

                resolvedCharacterResult = resolvedCharacterResultForSession;
            }
        }

        // Build response with free spell counts if this was a free grant
        // Note: Backend updates resolution session automatically, but does not return resolvedCharacter
        // Frontend should call resolution.refreshState() to refresh resolution state
        const response: RemoveSpellKnownResponse = {
            message: 'Spell removed successfully'
        };

        if (wasFreeGrant && resolvedCharacterResult) {
            // Use resolved progressions from the session update (already done above)
            const effectiveResolvedProgressions = resolvedCharacterResult.resolvedProgressions;

            // Calculate available free spells for this advancement level
            const availableFreeSpells = ResolvedFeatureService.getAvailableSpellbookSpells(
                effectiveResolvedProgressions,
                advancement.level,
                advancement.classId,
                updatedCharacter
            );

            // Count free grants for this advancement (after removal)
            const freeSpellsUsed = await this.countFreeGrantsForAdvancement(advancementId);
            const remainingFreeSpells = availableFreeSpells - freeSpellsUsed;

            response.freeSpellsUsed = freeSpellsUsed;
            response.availableFreeSpells = availableFreeSpells;
            response.remainingFreeSpells = Math.max(0, remainingFreeSpells);
        }

        return response;
    },

    // NEW: Character detail methods (uses tracking, money, items, wounds, spell cast)
    async getCharacterUses(characterId: number) {
        const uses = await prisma.characterFeatureUses.findMany({
            where: { characterId },
        });
        return uses;
    },

    async updateFeatureUses(characterId: number, progressionId: number, entityId: number, delta: number) {
        // Find or create the uses record
        const existing = await prisma.characterFeatureUses.findUnique({
            where: {
                characterId_progressionId_featureEntityId: {
                    characterId,
                    progressionId,
                    featureEntityId: entityId,
                },
            },
        });

        if (existing) {
            const newCurrentUses = Math.max(0, Math.min(existing.maxUses, existing.currentUses + delta));
            return await prisma.characterFeatureUses.update({
                where: { id: existing.id },
                data: { currentUses: newCurrentUses },
            });
        } else {
            // Need to get maxUses and frequency from the feature entity
            const featureEntity = await prisma.featureEntity.findUnique({
                where: { id: entityId },
                include: {
                    featureProgression: true,
                },
            });

            if (!featureEntity) {
                throw new Error('Feature entity not found');
            }

            // Determine maxUses and frequency from the feature entity
            // For uses per day/week, the value field typically contains the number of uses
            // and the frequency should be determined from the feature definition
            // For now, we'll use the value as maxUses and default to PER_DAY
            const maxUses = featureEntity.value || 1;
            const frequency = USES_FREQUENCY_ENUM.PER_DAY; // Default to PER_DAY - should be determined from feature definition

            const newCurrentUses = Math.max(0, Math.min(maxUses, delta));
            return await prisma.characterFeatureUses.create({
                data: {
                    characterId,
                    progressionId,
                    featureEntityId: entityId,
                    currentUses: newCurrentUses,
                    maxUses,
                    frequency,
                },
            });
        }
    },

    async resetDailyUses(characterId: number): Promise<UpdateResponse> {
        await prisma.$transaction([
            // Reset daily uses (frequency = PER_DAY)
            prisma.characterFeatureUses.updateMany({
                where: {
                    characterId,
                    frequency: USES_FREQUENCY_ENUM.PER_DAY,
                },
                data: {
                    currentUses: 0,
                },
            }),
        ]);
        // Reset spell cast counts (separate call to allow independent reset)
        await this.resetDailySpellPreparations(characterId);
        return { message: 'Daily uses reset successfully' };
    },

    async resetAllUses(characterId: number): Promise<UpdateResponse> {
        await prisma.characterFeatureUses.updateMany({
            where: { characterId },
            data: {
                currentUses: 0,
            },
        });
        return { message: 'All uses reset successfully' };
    },

    async updateMoney(characterId: number, money: UpdateMoneyRequest): Promise<UpdateResponse> {
        const updateData: {
            platinum?: number;
            gold?: number;
            silver?: number;
            copper?: number;
        } = {};

        if (money.platinum !== undefined) {
            updateData.platinum = money.platinum;
        }
        if (money.gold !== undefined) {
            updateData.gold = money.gold;
        }
        if (money.silver !== undefined) {
            updateData.silver = money.silver;
        }
        if (money.copper !== undefined) {
            updateData.copper = money.copper;
        }

        await prisma.userCharacter.update({
            where: { id: characterId },
            data: updateData,
        });
        return { message: 'Money updated successfully' };
    },

    async addItem(characterId: number, item: AddItemRequest) {
        const result = await prisma.characterItem.create({
            data: {
                characterId,
                baseItemId: item.baseItemId,
                name: item.name,
                quantity: item.quantity,
                location: item.location,
            },
        });
        return { id: result.id.toString(), message: 'Item added successfully' };
    },

    async removeItem(characterId: number, itemId: number): Promise<UpdateResponse> {
        await prisma.characterItem.delete({
            where: {
                id: itemId,
                characterId, // Ensure the item belongs to the character
            },
        });
        return { message: 'Item removed successfully' };
    },

    async updateWounds(characterId: number, wounds: UpdateWoundsRequest): Promise<UpdateResponse> {
        // Note: wounds and nonlethal are not currently stored in the database
        // This is a placeholder for future implementation
        // For now, we'll need to add these fields to UserCharacter model
        // or create a separate CharacterHealth model
        // This method is implemented but will need database schema updates
        throw new Error('Wounds tracking not yet implemented in database schema');
    },

    async updateNotes(characterId: number, notes: UpdateNotesRequest): Promise<UpdateResponse> {
        const updateData: {
            notes?: string | null;
        } = {};

        if (notes.notes !== undefined) {
            updateData.notes = notes.notes;
        }

        await prisma.userCharacter.update({
            where: { id: characterId },
            data: updateData,
        });
        return { message: 'Notes updated successfully' };
    },

    async castSpell(characterId: number, preparationId: number): Promise<UpdateResponse> {
        const preparation = await prisma.characterSpellPreparation.findUnique({
            where: {
                id: preparationId,
            },
        });

        if (!preparation) {
            throw new Error('Spell preparation not found');
        }

        if (preparation.characterId !== characterId) {
            throw new Error('Spell preparation does not belong to this character');
        }

        if (preparation.timesCast >= preparation.quantity) {
            throw new Error('All prepared spells have already been cast');
        }

        await prisma.characterSpellPreparation.update({
            where: {
                id: preparationId,
            },
            data: {
                timesCast: {
                    increment: 1,
                },
            },
        });
        return { message: 'Spell cast successfully' };
    },

    async uncastSpell(characterId: number, preparationId: number): Promise<UpdateResponse> {
        const preparation = await prisma.characterSpellPreparation.findUnique({
            where: {
                id: preparationId,
            },
        });

        if (!preparation) {
            throw new Error('Spell preparation not found');
        }

        if (preparation.characterId !== characterId) {
            throw new Error('Spell preparation does not belong to this character');
        }

        if (preparation.timesCast <= 0) {
            throw new Error('No spells have been cast');
        }

        await prisma.characterSpellPreparation.update({
            where: {
                id: preparationId,
            },
            data: {
                timesCast: {
                    decrement: 1,
                },
            },
        });
        return { message: 'Spell uncast successfully' };
    },

    /**
     * Reset daily spell preparations (set timesCast = 0 for all preparations)
     * This is called when resetting daily uses to clear spell cast status
     */
    async resetDailySpellPreparations(characterId: number): Promise<UpdateResponse> {
        await prisma.characterSpellPreparation.updateMany({
            where: {
                characterId,
            },
            data: {
                timesCast: 0,
            },
        });
        return { message: 'Daily spell preparations reset successfully' };
    },

    /**
     * Sync items array - diffs against database and performs create/update/delete operations atomically.
     * 
     * Frontend sends full items array, backend determines what operations are needed.
     * 
     * @param characterId - Character ID
     * @param items - Full array of items from frontend state
     * @returns UpdateResponse
     */
    async syncItems(characterId: number, items: SyncItemsRequest['items']): Promise<UpdateResponse> {
        return await prisma.$transaction(async (tx) => {
            // Get current items from database
            const currentItems = await tx.characterItem.findMany({
                where: { characterId },
            });

            // Create maps for efficient lookup
            const currentItemsMap = new Map(currentItems.map(item => [item.id, item]));
            const incomingItemsMap = new Map<number, typeof items[0]>();

            // Track items by temporary ID (for new items without database ID)
            const incomingByTempId = new Map<number, typeof items[0]>();

            for (const item of items) {
                if (item.id && item.id > 0) {
                    // Has database ID - use it as key
                    incomingItemsMap.set(item.id, item);
                } else if (item.id && item.id < 0) {
                    // Temporary ID (negative) - track separately
                    incomingByTempId.set(item.id, item);
                }
            }

            // Find items to delete (in database but not in incoming array)
            const itemsToDelete = currentItems.filter(
                item => !incomingItemsMap.has(item.id)
            );

            // Find items to create (in incoming array but not in database, or have temp ID)
            const itemsToCreate = items.filter(
                item => !item.id || item.id < 0 || !currentItemsMap.has(item.id)
            );

            // Find items to update (in both arrays but different)
            const itemsToUpdate = items.filter(item => {
                if (!item.id || item.id < 0) return false; // Skip temp IDs
                const current = currentItemsMap.get(item.id);
                if (!current) return false;

                // Compare relevant fields
                return (
                    current.baseItemId !== item.baseItemId ||
                    current.quantity !== item.quantity ||
                    current.location !== item.location ||
                    current.name !== item.name
                );
            });

            // Perform operations
            if (itemsToDelete.length > 0) {
                await tx.characterItem.deleteMany({
                    where: {
                        id: { in: itemsToDelete.map(item => item.id) },
                        characterId,
                    },
                });
            }

            if (itemsToCreate.length > 0) {
                await tx.characterItem.createMany({
                    data: itemsToCreate.map(item => ({
                        characterId,
                        baseItemId: item.baseItemId,
                        name: item.name,
                        quantity: item.quantity ?? 1,
                        location: item.location,
                    })),
                });
            }

            if (itemsToUpdate.length > 0) {
                await Promise.all(
                    itemsToUpdate.map(item =>
                        tx.characterItem.update({
                            where: {
                                id: item.id!,
                                characterId,
                            },
                            data: {
                                baseItemId: item.baseItemId,
                                name: item.name,
                                quantity: item.quantity ?? 1,
                                location: item.location,
                            },
                        })
                    )
                );
            }

            return { message: 'Items synced successfully' };
        });
    },

    /**
     * Sync spell preparations array - diffs against database and performs create/update/delete operations atomically.
     * 
     * Frontend sends full spell preparations array, backend determines what operations are needed.
     * 
     * @param characterId - Character ID
     * @param spellPreparations - Full array of spell preparations from frontend state
     * @returns UpdateResponse
     */
    async syncSpellPreparations(characterId: number, spellPreparations: SyncSpellPreparationsRequest['spellPreparations']): Promise<UpdateResponse> {
        return await prisma.$transaction(async (tx) => {
            // Get current spell preparations from database
            const currentPreparations = await tx.characterSpellPreparation.findMany({
                where: { characterId },
            });

            // Create maps for efficient lookup
            const currentPreparationsMap = new Map(currentPreparations.map(prep => [prep.id, prep]));

            // Create composite key map for new preparations (classId-spellId-spellLevel-slotType-featId)
            const currentByCompositeKey = new Map<string, typeof currentPreparations[0]>();
            for (const prep of currentPreparations) {
                const key = `${prep.classId}-${prep.spellId}-${prep.spellLevel}-${prep.slotType}-${prep.featId ?? 'null'}`;
                currentByCompositeKey.set(key, prep);
            }

            const incomingPreparationsMap = new Map<number, typeof spellPreparations[0]>();
            const incomingByCompositeKey = new Map<string, typeof spellPreparations[0]>();

            for (const prep of spellPreparations) {
                if (prep.id && prep.id > 0) {
                    // Has database ID - use it as key
                    incomingPreparationsMap.set(prep.id, prep);
                } else {
                    // New preparation - use composite key
                    const slotType = prep.slotType ?? SpellSlotType.NORMAL;
                    const featId = prep.featId ?? null;
                    const key = `${prep.classId}-${prep.spellId}-${prep.spellLevel}-${slotType}-${featId ?? 'null'}`;
                    incomingByCompositeKey.set(key, prep);
                }
            }

            // Find preparations to delete (in database but not in incoming array)
            const preparationsToDelete = currentPreparations.filter(
                prep => !incomingPreparationsMap.has(prep.id)
            );

            // Find preparations to create (in incoming array but not in database)
            const preparationsToCreate = spellPreparations.filter(prep => {
                if (prep.id && prep.id > 0) {
                    // Has database ID - check if exists
                    return !currentPreparationsMap.has(prep.id);
                } else {
                    // New preparation - check by composite key
                    const slotType = prep.slotType ?? SpellSlotType.NORMAL;
                    const featId = prep.featId ?? null;
                    const key = `${prep.classId}-${prep.spellId}-${prep.spellLevel}-${slotType}-${featId ?? 'null'}`;
                    return !currentByCompositeKey.has(key);
                }
            });

            // Find preparations to update (in both arrays but different)
            const preparationsToUpdate = spellPreparations.filter(prep => {
                if (!prep.id || prep.id <= 0) return false; // Skip new preparations
                const current = currentPreparationsMap.get(prep.id);
                if (!current) return false;

                // Compare relevant fields
                const slotType = prep.slotType ?? SpellSlotType.NORMAL;
                const featId = prep.featId ?? null;
                return (
                    current.classId !== prep.classId ||
                    current.spellId !== prep.spellId ||
                    current.spellLevel !== prep.spellLevel ||
                    current.quantity !== prep.quantity ||
                    current.slotType !== slotType ||
                    current.featId !== featId ||
                    current.timesCast !== (prep.timesCast ?? 0)
                );
            });

            // Perform operations
            if (preparationsToDelete.length > 0) {
                await tx.characterSpellPreparation.deleteMany({
                    where: {
                        id: { in: preparationsToDelete.map(prep => prep.id) },
                        characterId,
                    },
                });
            }

            if (preparationsToCreate.length > 0) {
                await tx.characterSpellPreparation.createMany({
                    data: preparationsToCreate.map(prep => ({
                        characterId,
                        classId: prep.classId,
                        spellId: prep.spellId,
                        spellLevel: prep.spellLevel,
                        quantity: prep.quantity,
                        timesCast: prep.timesCast ?? 0,
                        slotType: prep.slotType ?? SpellSlotType.NORMAL,
                        featId: prep.featId ?? null,
                    })),
                });
            }

            if (preparationsToUpdate.length > 0) {
                await Promise.all(
                    preparationsToUpdate.map(prep => {
                        const slotType = prep.slotType ?? SpellSlotType.NORMAL;
                        const featId = prep.featId ?? null;
                        return tx.characterSpellPreparation.update({
                            where: {
                                id: prep.id!,
                                characterId,
                            },
                            data: {
                                classId: prep.classId,
                                spellId: prep.spellId,
                                spellLevel: prep.spellLevel,
                                quantity: prep.quantity,
                                timesCast: prep.timesCast ?? 0,
                                slotType: slotType,
                                featId: featId,
                            },
                        });
                    })
                );
            }

            return { message: 'Spell preparations synced successfully' };
        });
    },

    async syncSpellsKnown(characterId: number, advancementId: number, spellsKnown: SyncSpellsKnownRequest['spellsKnown']): Promise<UpdateResponse> {
        return await prisma.$transaction(async (tx) => {
            // Get current spellsKnown from database
            const currentSpellsKnown = await tx.advancementSpell.findMany({
                where: { advancementId },
            });

            // Create maps for efficient lookup
            const currentSpellsKnownMap = new Map(currentSpellsKnown.map(s => [s.spellId, s]));

            // Determine what to create, update, and delete
            const spellsKnownSet = new Set(spellsKnown.map(s => s.spellId));

            // Delete spells that are no longer in the new array
            const toDelete = currentSpellsKnown.filter(s => !spellsKnownSet.has(s.spellId));
            if (toDelete.length > 0) {
                await tx.advancementSpell.deleteMany({
                    where: {
                        advancementId,
                        spellId: { in: toDelete.map(s => s.spellId) }
                    }
                });
            }

            // Create or update spells
            for (const spell of spellsKnown) {
                const existing = currentSpellsKnownMap.get(spell.spellId);
                if (existing) {
                    // Update if isFreeGrant changed
                    if (existing.isFreeGrant !== spell.isFreeGrant) {
                        await tx.advancementSpell.update({
                            where: {
                                advancementId_spellId: {
                                    advancementId,
                                    spellId: spell.spellId
                                }
                            },
                            data: { isFreeGrant: spell.isFreeGrant }
                        });
                    }
                } else {
                    // Create new
                    await tx.advancementSpell.create({
                        data: {
                            advancementId,
                            spellId: spell.spellId,
                            isFreeGrant: spell.isFreeGrant
                        }
                    });
                }
            }

            return { message: 'Spells known synced successfully' };
        });
    },


}; 
