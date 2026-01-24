import { prisma } from '@/lib/prisma';
import type {
    CharacterIdParamRequest,
    Character,
    CreateCharacterRequest,
    SaveCharacterRequest,
    GetAllCharactersResponse,
    GetAllCharactersAdminResponse,
    CharacterWithAllDetailsResponse,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';
import { EditionId, SpellSlotType } from '@shared/static-data';

/**
 * Helper function to calculate class/level string from advancements.
 * 
 * @param advancements - Array of advancements with class abbreviations
 * @returns Class/level string (e.g., "Ftr 1/Clr 1" or "Ftr/Clr 1")
 */
function calculateClassLevelString(advancements: Array<{
    level: number;
    class?: { abbreviation: string | null } | null;
    secondaryClass?: { abbreviation: string | null } | null;
}>): string {
    if (advancements.length === 0) {
        return '';
    }

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
    return parts.join('/');
}

/**
 * Service for basic character CRUD operations.
 * 
 * Handles character creation, retrieval, updates, and deletion including
 * the complex saveCharacter operation that handles nested data.
 */
export const characterCrudService = {
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
            const classLevelString = calculateClassLevelString(advancements);

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
            const classLevelString = calculateClassLevelString(advancements);

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
        const classLevelString = calculateClassLevelString(advancements);

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

    async deleteCharacter(query: CharacterIdParamRequest): Promise<UpdateResponse> {
        await prisma.userCharacter.delete({
            where: { id: query.id },
        });

        return { message: 'Character deleted successfully' };
    },
};
