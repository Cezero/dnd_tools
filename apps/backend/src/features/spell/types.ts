import type { Spell, Class } from '@shared/prisma-client';
import type { SpellIdParamRequest, SpellQueryRequest, SpellQueryResponse, UpdateSpellRequest } from '@shared/schema';

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

export interface SpellService {
    getSpells(query: SpellQueryRequest): Promise<SpellQueryResponse>;
    getSpellById(id: SpellIdParamRequest): Promise<SpellWithLevelMapping | null>;
    updateSpell(id: SpellIdParamRequest, data: UpdateSpellRequest): Promise<{ message: string }>;
    deleteSpell(id: SpellIdParamRequest): Promise<{ message: string }>;
} 