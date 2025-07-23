import { PrismaClient, Prisma } from '@shared/prisma-client';
import { CharacterIdParamRequest, CharacterResponse, CreateCharacterRequest, CreateResponse, GetAllCharactersResponse, UpdateCharacterRequest, UpdateResponse } from '@shared/schema';
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
