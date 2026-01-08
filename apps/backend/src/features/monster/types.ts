import type {
    MonsterIdParamRequest,
    GetAllMonstersQueryRequest,
    UpdateMonsterRequest,
    GetMonsterResponse,
    GetAllMonstersResponse,
    MonsterHierarchyEntry,
    MonsterCacheResponse,
    UpdateResponse,
} from '@shared/schema';

export interface MonsterService {
    getAllMonsters(includeStatblockOnly?: boolean, typeId?: number): Promise<GetAllMonstersResponse>;
    getMonsterById(id: MonsterIdParamRequest): Promise<GetMonsterResponse | null>;
    getMonsterHierarchy(baseMonsterId: number): Promise<MonsterHierarchyEntry[]>;
    updateMonster(id: MonsterIdParamRequest, data: UpdateMonsterRequest): Promise<UpdateResponse>;
    deleteMonster(id: MonsterIdParamRequest): Promise<UpdateResponse>;
    getMonsterCache(): Promise<MonsterCacheResponse>;
}

