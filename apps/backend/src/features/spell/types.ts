import type { SpellIdParamRequest, GetSpellResponse, UpdateSpellRequest, GetAllSpellsResponse, UpdateResponse, ClassSpellListEntry, ClassSpellListResponse, SpellCacheResponse, Spell } from '@shared/schema';


export interface SpellService {
    getAllSpells(): Promise<GetAllSpellsResponse>;
    getSpellById(id: SpellIdParamRequest): Promise<GetSpellResponse | null>;
    updateSpell(id: SpellIdParamRequest, data: UpdateSpellRequest): Promise<UpdateResponse>;
    deleteSpell(id: SpellIdParamRequest): Promise<UpdateResponse>;
    getSpellsForClass(classId: number, level?: number): Promise<ClassSpellListResponse>;
    getBaseClassSpells(classId: number, level?: number): Promise<ClassSpellListResponse>;
    getSpellCache(): Promise<SpellCacheResponse>;
    getDomainSpells(domainIds: number[], characterLevel: number, classId: number): Promise<Array<{ domainId: number; domainName: string; spell: Spell; spellLevel: number; classSpellLevel: number | null }>>;
} 
