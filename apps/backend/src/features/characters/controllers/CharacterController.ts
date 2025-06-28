import { Request, Response } from 'express';
import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();

interface CharacterRequest extends Request {
    query: {
        page?: string;
        limit?: string;
        sort?: string;
        order?: string;
        name?: string;
        userId?: string;
    };
}

interface CharacterCreateRequest extends Request {
    body: {
        userId: number;
        name: string;
        raceId: number;
        alignmentId: number;
        age?: number;
        height?: number;
        weight?: number;
        eyes?: string;
        hair?: string;
    };
}

interface CharacterUpdateRequest extends Request {
    params: { id: string };
    body: {
        userId: number;
        name: string;
        raceId: number;
        alignmentId: number;
        age?: number;
        height?: number;
        weight?: number;
        eyes?: string;
        hair?: string;
    };
}

interface CharacterDeleteRequest extends Request {
    params: { id: string };
}

interface CharacterGetRequest extends Request {
    params: { id: string };
}

// Helper function to validate character data
function ValidateCharacterData(character: any): string | null {
    const { name, userId } = character;
    if (!name || name.trim() === '') {
        return 'Character name cannot be empty.';
    }
    if (!userId) {
        return 'User ID is required.';
    }
    // Add more validation rules as needed
    return null; // No error
}

export async function GetAllCharacters(req: CharacterRequest, res: Response): Promise<void> {
    const { page = '1', limit = '25', sort = 'name', order = 'asc', name = '', userId = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const allowedSorts = ['name', 'createdAt', 'age'];
    const sortBy = allowedSorts.includes(sort) ? sort : 'name';
    const sortOrder = order === 'desc' ? 'desc' : 'asc';

    // Build where clause for filtering
    const where: any = {};

    if (name) {
        where.name = { contains: name, mode: 'insensitive' };
    }
    if (userId) {
        where.userId = parseInt(userId);
    }

    try {
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

        // Transform the data to match the expected format
        const results = characters.map(character => ({
            ...character,
            race_name: character.race?.name || null,
        }));

        res.json({
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            results,
        });
    } catch (error) {
        console.error('Error getting all characters:', error);
        res.status(500).send('Server error');
    }
}

export async function GetCharacterById(req: CharacterGetRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        const character = await prisma.userCharacter.findUnique({
            where: { id: parseInt(id) },
            include: {
                race: {
                    select: {
                        name: true,
                    },
                },
            },
        });

        if (!character) {
            res.status(404).send('Character not found');
            return;
        }

        // Transform the data to match the expected format
        const result = {
            ...character,
            race_name: character.race?.name || null,
        };

        res.json(result);
    } catch (error) {
        console.error('Error getting character by ID:', error);
        res.status(500).send('Server error');
    }
}

export async function CreateCharacter(req: CharacterCreateRequest, res: Response): Promise<void> {
    const newCharacter = req.body;

    const validationError = ValidateCharacterData(newCharacter);
    if (validationError) {
        res.status(400).json({ error: validationError });
        return;
    }

    try {
        const result = await prisma.userCharacter.create({
            data: {
                userId: newCharacter.userId,
                name: newCharacter.name,
                raceId: newCharacter.raceId,
                alignmentId: newCharacter.alignmentId,
                age: newCharacter.age || null,
                height: newCharacter.height || null,
                weight: newCharacter.weight || null,
                eyes: newCharacter.eyes || null,
                hair: newCharacter.hair || null,
            },
        });

        res.status(201).json({ id: result.id, message: 'Character created successfully' });
    } catch (error) {
        console.error('Error creating character:', error);
        res.status(500).send('Server error');
    }
}

export async function UpdateCharacter(req: CharacterUpdateRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const updatedCharacter = req.body;

    const validationError = ValidateCharacterData(updatedCharacter);
    if (validationError) {
        res.status(400).json({ error: validationError });
        return;
    }

    try {
        const result = await prisma.userCharacter.update({
            where: { id: parseInt(id) },
            data: {
                userId: updatedCharacter.userId,
                name: updatedCharacter.name,
                raceId: updatedCharacter.raceId,
                alignmentId: updatedCharacter.alignmentId,
                age: updatedCharacter.age || null,
                height: updatedCharacter.height || null,
                weight: updatedCharacter.weight || null,
                eyes: updatedCharacter.eyes || null,
                hair: updatedCharacter.hair || null,
            },
        });

        res.status(200).json({ message: 'Character updated successfully' });
    } catch (error) {
        console.error('Error updating character:', error);
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            res.status(404).send('Character not found or no changes made');
        } else {
            res.status(500).send('Server error');
        }
    }
}

export async function DeleteCharacter(req: CharacterDeleteRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        await prisma.userCharacter.delete({
            where: { id: parseInt(id) },
        });
        res.status(200).json({ message: 'Character deleted successfully' });
    } catch (error) {
        console.error('Error deleting character:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            res.status(404).send('Character not found');
        } else {
            res.status(500).send('Server error');
        }
    }
}

export async function Resolve(characterNames: string[]): Promise<any[]> {
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

    return characters.map(character => ({
        ...character,
        race_name: character.race?.name || null,
    }));
} 