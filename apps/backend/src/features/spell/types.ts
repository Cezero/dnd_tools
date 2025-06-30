import type { Request } from 'express';

import type { Spell, Class } from '@shared/prisma-client';

// Extend Prisma Spell type for query parameters, making all fields optional and string-based
export type SpellQueryParams = Partial<Record<keyof Spell, string | string[]>> & {
    classId?: string | string[];
    spellLevel?: string | string[];
    schools?: string | string[];
    descriptors?: string | string[];
    source?: string | string[];
    components?: string | string[];
    page?: string;
    limit?: string;
    [key: string]: string | string[] | undefined;
};

export interface UpdateSpellRequest {
    summary?: string;
    description?: string;
    castingTime?: string;
    range?: string;
    rangeTypeId?: number;
    rangeValue?: string;
    area?: string;
    duration?: string;
    savingThrow?: string;
    spellResistance?: string;
    editionId?: number;
    schools?: number[];
    subschools?: number[];
    descriptors?: number[];
    components?: number[];
    effect?: string;
    target?: string;
}

// Request interfaces extending Express Request
export interface SpellRequest extends Request {
    query: SpellQueryParams;
}

export interface SpellCreateRequest extends Request {
    body: Partial<Spell>;
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