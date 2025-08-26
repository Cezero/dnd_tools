import { PrismaClient } from '@shared/prisma-client';
import {
    CharacterIdParamRequest,
    CharacterResponse,
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
} from '@shared/schema';


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

    async getCharacterById(query: CharacterIdParamRequest): Promise<CharacterResponse | null> {
        const character = await prisma.userCharacter.findUnique({
            where: { id: query.id },
            include: {
                race: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return character as CharacterResponse;
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
            },
        });

        return character as CharacterWithAllDetailsResponse;
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
}; 
