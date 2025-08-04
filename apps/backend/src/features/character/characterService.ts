import { PrismaClient, Prisma } from '@shared/prisma-client';
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
    CharacterAdvancementResponse,
    CharacterAdvancementWithDetailsResponse,
    CreateSpellPreparationRequest,
    UpdateSpellPreparationRequest,
    CharacterSpellPreparationResponse,
    CharacterSpellPreparationWithMetamagicResponse,
    CreateCharacterAttributeRequest,
    UpdateCharacterAttributeRequest,
    CharacterAttributeResponse,
    CharacterWithAllDetailsResponse,
} from '@shared/schema';
import type { AuthUser } from '@shared/schema';

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
                attributes: true,
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

        const result = await prisma.characterSpellPreparation.create({
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

    // Character attribute methods
    async createCharacterAttribute(data: CreateCharacterAttributeRequest): Promise<CreateResponse> {
        const result = await prisma.userCharacterAttribute.create({
            data,
        });

        return { id: result.id.toString(), message: 'Character attribute created successfully' };
    },

    async updateCharacterAttribute(id: number, data: UpdateCharacterAttributeRequest): Promise<UpdateResponse> {
        await prisma.userCharacterAttribute.update({
            where: { id },
            data,
        });

        return { message: 'Character attribute updated successfully' };
    },

    async deleteCharacterAttribute(id: number): Promise<UpdateResponse> {
        await prisma.userCharacterAttribute.delete({
            where: { id },
        });

        return { message: 'Character attribute deleted successfully' };
    },

    async getCharacterAttributes(characterId: number): Promise<CharacterAttributeResponse[]> {
        const attributes = await prisma.userCharacterAttribute.findMany({
            where: { characterId },
        });

        return attributes as CharacterAttributeResponse[];
    },
}; 
