import { PrismaClient } from '@shared/prisma-client';
import {
    CharacterIdParamRequest,
    Character,
    CreateCharacterRequest,
    CreateResponse,
    GetAllCharactersResponse,
    UpdateResponse,
    // New types for advancement and spell preparation
    CreateAdvancementRequest,
    UpdateAdvancementRequest,
    CharacterAdvancementWithDetailsResponse,
    CreateSpellPreparationRequest,
    UpdateSpellPreparationRequest,
    CharacterSpellPreparationWithMetamagicResponse,
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
} from '@shared/schema';
import { EditionId } from '@shared/static-data';
import {
    isGestaltCharacter,
    calculateGestaltCharacterStats,
    calculateGestaltStats,
    getGestaltClassesForLevel,
    validateGestaltClasses,
    type GestaltStats
} from '@shared/utils';


import type { CharacterService } from './types';

const prisma = new PrismaClient();

export const characterService: CharacterService = {
    async getAllCharacters(userId: number): Promise<GetAllCharactersResponse> {
        const [characters, total] = await Promise.all([
            prisma.userCharacter.findMany({
                where: { userId },
                include: {
                    race: {
                        select: {
                            id: true,
                            name: true,
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

            return {
                ...character,
                characterLevel,
                classLevelString,
            };
        });

        return {
            total,
            results: charactersWithClassInfo,
        };
    },

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

    async getCharacterWithAllDetails(query: CharacterIdParamRequest): Promise<CharacterWithAllDetailsResponse | null> {
        const character = await prisma.userCharacter.findUnique({
            where: { id: query.id },
            include: {
                race: {
                    select: {
                        id: true,
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
                abilityScores: true,
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
                preparedSpells: {
                    include: {
                        metamagics: true,
                    },
                },
                disallowedSources: true,
                characterItems: true,
                attackDefinitions: true,
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

        return {
            ...character,
            characterLevel,
            classLevelString,
        };
    },

    async createCharacter(data: CreateCharacterRequest): Promise<CreateResponse> {
        const result = await prisma.userCharacter.create({
            data: {
                ...data,
                editionId: data.editionId ?? EditionId.DND_3_5E, // Default to D&D 3.5 Edition if not provided
            },
        });

        return { id: result.id.toString(), message: 'Character created successfully' };
    },

    async saveCharacter(characterId: number | null, data: SaveCharacterRequest): Promise<CreateResponse | UpdateResponse> {
        // Extract nested data
        const { abilityScores, advancement, equipment, attackDefinitions, ...characterData } = data;

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
                        editionId: characterData.editionId ?? EditionId.DND_3_5E, // Default to D&D 3.5 Edition if not provided
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
                                create: featureChoices.map(choice => ({
                                    ...choice,
                                    characterId: finalCharacterId,
                                    advancementId: 0, // Will be updated below
                                }))
                            } : undefined,
                        },
                    });

                    // Update featureChoices with the correct advancementId if they were created
                    if (featureChoices && featureChoices.length > 0) {
                        await tx.characterFeatureChoice.updateMany({
                            where: {
                                characterId: finalCharacterId,
                                advancementId: 0,
                                progressionId: { in: featureChoices.map(c => c.progressionId) }
                            },
                            data: {
                                advancementId: newAdvancement.id
                            }
                        });
                    }
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

            if (characterId) {
                return { message: 'Character saved successfully' };
            } else {
                return { id: finalCharacterId.toString(), message: 'Character created successfully' };
            }
        });
    },

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
    async createSpellPreparation(data: CreateSpellPreparationRequest): Promise<CreateResponse> {
        // Generate a unique prepKey
        const prepKey = `${data.characterId}-${data.classId}-${data.spellId}-${data.spellLevel}-${Date.now()}`;

        await prisma.characterSpellPreparation.create({
            data: {
                ...data,
                prepKey,
            },
        });

        return { id: prepKey, message: 'Spell preparation created successfully' };
    },

    async updateSpellPreparation(characterId: number, prepKey: string, data: UpdateSpellPreparationRequest): Promise<UpdateResponse> {
        await prisma.characterSpellPreparation.update({
            where: {
                characterId_prepKey: {
                    characterId,
                    prepKey,
                }
            },
            data,
        });

        return { message: 'Spell preparation updated successfully' };
    },

    async deleteSpellPreparation(characterId: number, prepKey: string): Promise<UpdateResponse> {
        await prisma.characterSpellPreparation.delete({
            where: {
                characterId_prepKey: {
                    characterId,
                    prepKey,
                }
            },
        });

        return { message: 'Spell preparation deleted successfully' };
    },

    async getCharacterSpellPreparations(characterId: number): Promise<CharacterSpellPreparationWithMetamagicResponse[]> {
        const preparations = await prisma.characterSpellPreparation.findMany({
            where: { characterId },
            include: {
                metamagics: true,
            },
        });

        return preparations as CharacterSpellPreparationWithMetamagicResponse[];
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

    async removeDisallowedSource(characterId: number, sourceBookId: number): Promise<void> {
        await prisma.characterDisallowedSource.deleteMany({
            where: {
                characterId,
                sourceBookId,
            },
        });
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
        }

        // Validate attack definition rules based on items
        // Dual-wield: both items required and different
        if (data.offHandCharacterItemId !== null && data.offHandCharacterItemId !== undefined) {
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
                // For dual wield, also check slot+1
                const isDualWield = data.offHandCharacterItemId !== null && data.offHandCharacterItemId !== undefined;
                if (isDualWield && existing.attackSlot === data.attackSlot + 1) {
                    throw new Error(`Attack slot ${data.attackSlot + 1} is already occupied (needed for dual wield off-hand)`);
                }
                // If existing is dual wield, check if it occupies our slot
                if (existing.attackSlot !== null && data.attackSlot === existing.attackSlot + 1) {
                    // Check if existing is dual wield by checking if it has offHandCharacterItemId
                    const existingIsDualWield = existing.offHandCharacterItemId !== null;
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

        if (data.offHandCharacterItemId !== undefined && data.offHandCharacterItemId !== null) {
            const offHandItem = await prisma.characterItem.findFirst({
                where: {
                    id: data.offHandCharacterItemId,
                    characterId: characterId,
                },
            });
            if (!offHandItem) {
                throw new Error('Off hand character item does not belong to this character');
            }
        }

        // Validate attack definition rules based on items
        const mainHand = data.mainHandCharacterItemId ?? existing.mainHandCharacterItemId;
        const offHand = data.offHandCharacterItemId ?? existing.offHandCharacterItemId;

        // Dual-wield: both items required and different
        if (offHand !== null && offHand !== undefined) {
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
                // For dual wield, also check slot+1
                const isDualWield = offHand !== null && offHand !== undefined;
                if (isDualWield && other.attackSlot === attackSlot + 1) {
                    throw new Error(`Attack slot ${attackSlot + 1} is already occupied (needed for dual wield off-hand)`);
                }
                // If other is dual wield, check if it occupies our slot
                if (other.attackSlot !== null && attackSlot === other.attackSlot + 1) {
                    const otherIsDualWield = other.offHandCharacterItemId !== null;
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

}; 
