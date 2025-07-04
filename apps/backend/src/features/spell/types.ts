import type { Spell, Class } from '@shared/prisma-client';
import type { SpellIdParamRequest, SpellQueryRequest, SpellQueryResponse, GetSpellResponse, UpdateSpellRequest } from '@shared/schema';


export interface SpellService {
    getSpells(query: SpellQueryRequest): Promise<SpellQueryResponse>;
    getSpellById(id: SpellIdParamRequest): Promise<GetSpellResponse | null>;
    updateSpell(id: SpellIdParamRequest, data: UpdateSpellRequest): Promise<{ message: string }>;
    deleteSpell(id: SpellIdParamRequest): Promise<{ message: string }>;
} 