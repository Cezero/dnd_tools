import { PrismaClient, Prisma } from '@shared/prisma-client';

import type { CharacterData, CharacterService } from './types';

const prisma = new PrismaClient();

// Helper function to validate character data
function validateCharacterData(character: CharacterData): string | null {
    const { name, userId } = character;
    if (!name || name.trim() === '') {
        return 'Character name cannot be empty.';
    }
    if (!userId) {
        return 'User ID is required.';
    }
    return null; // No error
}

export const characterService: CharacterService = {
    async getAllCharacters(query) {
        const { page = '1', limit = '25', sort = 'name', order = 'asc', name = '', userId = '' } = query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const allowedSorts = ['name', 'createdAt', 'age'];
        const sortBy = allowedSorts.includes(sort) ? sort : 'name';
        const sortOrder = order === 'desc' ? 'desc' : 'asc';

        // Build where clause for filtering
        const where: Prisma.UserCharacterWhereInput = {};

        if (name) {
            where.name = { contains: name };
        }
        if (userId) {
            where.userId = parseInt(userId);
        }

        const [characters, total] = await Promise.all([
            prisma.userCharacter.findMany({
                where,
                skip: offset,
                take: parseInt(limit),
                orderBy: { [sortBy]: sortOrder },
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
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            results: characters,
        };
    },

    async getCharacterById(id) {
        const character = await prisma.userCharacter.findUnique({
            where: { id },
            include: {
                race: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return character;
    },

    async createCharacter(data) {
        const result = await prisma.userCharacter.create({
            data,
        });

        return { id: result.id, message: 'Character created successfully' };
    },

    async updateCharacter(id, data) {
        await prisma.userCharacter.update({
            where: { id },
            data,
        });

        return { message: 'Character updated successfully' };
    },

    async deleteCharacter(id) {
        await prisma.userCharacter.delete({
            where: { id },
        });

        return { message: 'Character deleted successfully' };
    },

    validateCharacterData,

    async resolve(characterNames: string[]) {
        const characters = await prisma.userCharacter.findMany({
            where: {
                name: {
                    in: characterNames,
                },
            },
            include: {
                race: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        return characters;
    },
}; 