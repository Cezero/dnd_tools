import { PrismaClient } from '@shared/prisma-client';
import {
    SourceBookCacheResponse,
} from '@shared/schema';

import type { SourceBookService } from './types';

const prisma = new PrismaClient();

export const sourceBookService: SourceBookService = {
    async getSourceBookCache(): Promise<SourceBookCacheResponse> {
        const sourceBooks = await prisma.sourceBook.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                abbreviation: true,
                editionId: true,
                isVisible: true,
                settingId: true,
                hasClasses: true,
                hasSpells: true,
                hasRaces: true,
                hasDomains: true,
                hasDeities: true,
                hasItems: true,
            }
        });
        return {
            total: sourceBooks.length,
            results: sourceBooks,
        };
    },
};
