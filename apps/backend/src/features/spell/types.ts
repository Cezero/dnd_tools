import type { SpellIdParamRequest, GetSpellResponse, UpdateSpellRequest, GetAllSpellsResponse } from '@shared/schema';


export interface SpellService {
    getAllSpells(): Promise<GetAllSpellsResponse>;
    getSpellById(id: SpellIdParamRequest): Promise<GetSpellResponse | null>;
    updateSpell(id: SpellIdParamRequest, data: UpdateSpellRequest): Promise<{ message: string }>;
    deleteSpell(id: SpellIdParamRequest): Promise<{ message: string }>;
} 
