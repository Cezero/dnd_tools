import type { SpellIdParamRequest, GetSpellResponse, UpdateSpellRequest, GetAllSpellsResponse, UpdateResponse, ClassSpellListEntry, ClassSpellListResponse } from '@shared/schema';


export interface SpellService {
    getAllSpells(): Promise<GetAllSpellsResponse>;
    getSpellById(id: SpellIdParamRequest): Promise<GetSpellResponse | null>;
    updateSpell(id: SpellIdParamRequest, data: UpdateSpellRequest): Promise<UpdateResponse>;
    deleteSpell(id: SpellIdParamRequest): Promise<UpdateResponse>;
    getSpellsForClass(classId: number, level?: number): Promise<ClassSpellListResponse>;
    getBaseClassSpells(classId: number, level?: number): Promise<ClassSpellListResponse>;
    getVariantSpellOverrides(variantId: number): Promise<ClassSpellListEntry[]>;
    applySpellOverrides(baseSpells: ClassSpellListEntry[], overrides: ClassSpellListEntry[]): ClassSpellListEntry[];
} 
