import { PrismaClient, Prisma } from '@shared/prisma-client';
import type { CharacterData, CharacterQuery, CharacterWithRace, CharacterListResponse } from './types';

const prisma = new PrismaClient();

export interface CharacterService {
    getAllCharacters: (query: CharacterQuery) => Promise<CharacterListResponse>;
    getCharacterById: (id: number) => Promise<CharacterWithRace | null>;
    createCharacter: (data: CharacterData) => Promise<{ id: number; message: string }>;
    updateCharacter: (id: number, data: CharacterData) => Promise<{ message: string }>;
    deleteCharacter: (id: number) => Promise<{ message: string }>;
    validateCharacterData: (data: CharacterData) => string | null;
    resolve: (characterNames: string[]) => Promise<Prisma.UserCharacterGetPayload<{
        include: {
            race: {
                select: {
                    name: true;
                };
            };
        };
    }>[]>;
}

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
            data: {
                userId: data.userId,
                name: data.name,
                raceId: data.raceId,
                alignmentId: data.alignmentId,
                age: data.age || null,
                height: data.height || null,
                weight: data.weight || null,
                eyes: data.eyes || null,
                hair: data.hair || null,
                gender: data.gender || null,
                notes: data.notes || null,
            },
        });

        return { id: result.id, message: 'Character created successfully' };
    },

    async updateCharacter(id, data) {
        await prisma.userCharacter.update({
            where: { id },
            data: {
                userId: data.userId,
                name: data.name,
                raceId: data.raceId,
                alignmentId: data.alignmentId,
                age: data.age || null,
                height: data.height || null,
                weight: data.weight || null,
                eyes: data.eyes || null,
                hair: data.hair || null,
                gender: data.gender || null,
                notes: data.notes || null,
            },
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