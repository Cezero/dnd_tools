import { PrismaClient, Prisma } from '@shared/prisma-client';
import { CharacterIdParamRequest, CharacterResponse, CreateCharacterRequest, CreateResponse, GetAllCharactersResponse, UpdateCharacterRequest, UpdateResponse } from '@shared/schema';

import type { CharacterService } from './types';

const prisma = new PrismaClient();

export const characterService: CharacterService = { 
    async getAllCharacters(): Promise<GetAllCharactersResponse> {
        const [characters, total] = await Promise.all([
            prisma.userCharacter.findMany({
                orderBy: { name: 'asc' },
            }),
            prisma.userCharacter.count(),
        ]);

        return {
            total: characters.length,
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
}; 
