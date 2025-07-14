import type { SpellIdParamRequest, SpellQueryResponse, GetSpellResponse, UpdateSpellRequest } from '@shared/schema';


export interface SpellService {
    getAllSpells(): Promise<SpellQueryResponse>;
    getSpellById(id: SpellIdParamRequest): Promise<GetSpellResponse | null>;
    updateSpell(id: SpellIdParamRequest, data: UpdateSpellRequest): Promise<{ message: string }>;
    deleteSpell(id: SpellIdParamRequest): Promise<{ message: string }>;
} 
