import type { Request } from 'express';
import type { z } from 'zod';

import type { Spell, Class, Prisma } from '@shared/prisma-client';
import type { UpdateSpellRequest, SpellQueryRequest } from '@shared/schema';
import { SpellQuerySchema } from '@shared/schema';

// Raw query parameters type for Express (before Zod transformation)
export type SpellQueryRaw = z.input<typeof SpellQuerySchema>;

// Request interfaces extending Express Request
export interface SpellRequest extends Request {
    query: SpellQueryRaw;
}

export interface SpellCreateRequest extends Request {
    body: Prisma.SpellCreateInput;
}

export interface SpellUpdateRequest extends Request {
    params: { id: string };
    body: UpdateSpellRequest;
}

export interface SpellDeleteRequest extends Request {
    params: { id: string };
}

// Use Prisma types for spell with level mapping
export type SpellWithLevelMapping = Spell & {
    levelMapping: Array<{
        id: number;
        classId: number;
        spellId: number;
        level: number;
        isVisible: boolean;
        class: Pick<Class, 'name' | 'abbreviation'>;
    }>;
};

export interface SpellListResponse {
    page: number;
    limit: number;
    total: number;
    results: SpellWithLevelMapping[];
}

// Service interface using the transformed Zod schema type
export interface SpellService {
    getAllSpells(query: SpellQueryRequest): Promise<SpellListResponse>;
    getSpellById(id: number): Promise<SpellWithLevelMapping | null>;
    updateSpell(id: number, data: UpdateSpellRequest): Promise<{ message: string }>;
    resolveSpellNames(spellNames: string[]): Promise<Record<string, number>>;
} 