import { PrismaClient } from '@shared/prisma-client';
import {
    CharacterIdParamRequest,
    Character,
    CreateCharacterRequest,
    CreateResponse,
    GetAllCharactersResponse,
    UpdateCharacterRequest,
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
                },
                orderBy: { name: 'asc' },
            }),
            prisma.userCharacter.count({
                where: { userId },
            }),
        ]);

        return {
            total,
            results: characters,
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

    async updateCharacter(query: CharacterIdParamRequest, data: UpdateCharacterRequest): Promise<UpdateResponse> {
        await prisma.userCharacter.update({
            where: { id: query.id },
            data,
        });

        return { message: 'Character updated successfully' };
    },

    async deleteCharacter(query: CharacterIdParamRequest): Promise<UpdateResponse> {
        await prisma.userCharacter.delete({
            where: { id: query.id },
        });

        return { message: 'Character deleted successfully' };
    },

    // Character advancement methods
    async createAdvancement(data: CreateAdvancementRequest): Promise<CreateResponse> {
        const result = await prisma.characterAdvancement.create({
            data: {
                ...data,
                version: 1, // Default version for new advancements
            },
        });

        return { id: result.id.toString(), message: 'Character advancement created successfully' };
    },

    async updateAdvancement(id: number, data: UpdateAdvancementRequest): Promise<UpdateResponse> {
        await prisma.characterAdvancement.update({
            where: { id },
            data,
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
