import { prisma } from '@/lib/prisma';
import type {
    CreateCharacterDisallowedSourceRequest,
    CharacterDisallowedSource,
    UpdateResponse,
} from '@shared/schema';


/**
 * Service for managing character disallowed sources.
 * 
 * Handles operations for disallowing specific source books for characters,
 * which affects which features, spells, and items are available.
 */
export const characterDisallowedSourceService = {
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

    async removeDisallowedSource(characterId: number, sourceBookId: number): Promise<UpdateResponse> {
        await prisma.characterDisallowedSource.deleteMany({
            where: {
                characterId,
                sourceBookId,
            },
        });
        return { message: 'Disallowed source removed successfully' };
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
};
