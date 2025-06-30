import type { Spell, Class } from '@shared/prisma-client/client';

export interface SpellQueryParams {
    name?: string;
    classId?: string | string[];
    spellLevel?: string | string[];
    schools?: string | string[];
    descriptors?: string | string[];
    source?: string | string[];
    components?: string | string[];
    editionId?: string;
    page?: string;
    limit?: string;
}

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