import { PrismaClient, Prisma } from '@shared/prisma-client';
import { CharacterIdParamRequest, CharacterQueryRequest, CharacterResponse, CreateCharacterRequest, GetAllCharactersResponse, UpdateCharacterRequest } from '@shared/schema';

import type { CharacterService } from './types';

const prisma = new PrismaClient();

export const characterService: CharacterService = {
    async getCharacters(query: CharacterQueryRequest) {
        const page = query.page;
        const limit = query.limit;
        const offset = (page - 1) * limit;

        // Build where clause for filtering
        const where: Prisma.UserCharacterWhereInput = {};

        if (query.name) {
            where.name = { contains: query.name };
        }
        if (query.userId) {
            where.userId = query.userId;
        }

        const [characters, total] = await Promise.all([
            prisma.userCharacter.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { name: 'asc' },
                include: {
                    race: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),
            prisma.userCharacter.count({ where }),
        ]);

        return {
            page,
            limit,
            total,
            results: characters,
        };
    },

    async getCharacterById(query: CharacterIdParamRequest) {
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

    async createCharacter(data: CreateCharacterRequest) {
        const result = await prisma.userCharacter.create({
            data,
        });

        return { id: result.id, message: 'Character created successfully' };
    },

    async updateCharacter(query: CharacterIdParamRequest, data: UpdateCharacterRequest) {
        await prisma.userCharacter.update({
            where: { id: query.id },
            data,
        });

        return { message: 'Character updated successfully' };
    },

    async deleteCharacter(query: CharacterIdParamRequest) {
        await prisma.userCharacter.delete({
            where: { id: query.id },
        });

        return { message: 'Character deleted successfully' };
    },

    async getAllCharacters() {
        const characters = await prisma.userCharacter.findMany({
            include: {
                race: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return characters as GetAllCharactersResponse;
    },
}; 