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
} from '@shared/schema';
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
            },
        });

        return character;
    },

    async createCharacter(data: CreateCharacterRequest): Promise<CreateResponse> {
        const result = await prisma.userCharacter.create({
            data,
        });

        return { id: result.id.toString(), message: 'Character created successfully' };
    },

    async saveCharacter(characterId: number | null, data: SaveCharacterRequest): Promise<CreateResponse | UpdateResponse> {
        // Extract nested data
        const { abilityScores, advancement, ...characterData } = data;

        return await prisma.$transaction(async (tx) => {
            let finalCharacterId = characterId;

            // Create or update character
            if (!finalCharacterId) {
                // Create new character
                const character = await tx.userCharacter.create({
                    data: characterData as CreateCharacterRequest,
                });
                finalCharacterId = character.id;
            } else {
                // Update existing character
                await tx.userCharacter.update({
                    where: { id: finalCharacterId },
                    data: characterData,
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

                const { skills, feats, ...advancementData } = advancement;

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
                } else {
                    // Create new advancement
                    await tx.characterAdvancement.create({
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
                        },
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
        const { skills, feats, ...advancementData } = data;

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
            },
        });

        return { id: result.id.toString(), message: 'Character advancement created successfully' };
    },

    async updateAdvancement(id: number, data: UpdateAdvancementRequest): Promise<UpdateResponse> {
        const { skills, feats, ...advancementData } = data;

        // Handle nested updates: delete existing and create new
        await prisma.$transaction(async (tx) => {
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
