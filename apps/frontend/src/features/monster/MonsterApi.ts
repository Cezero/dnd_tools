import { typedApi } from '@/services/Api';
import {
    MonsterIdParamSchema,
    GetAllMonstersQuerySchema,
    UpdateMonsterSchema,
    GetMonsterResponseSchema,
    GetAllMonstersResponseSchema,
    UpdateResponseSchema,
} from '@shared/schema';

export const MonsterApi = {
    getAllMonsters: typedApi<typeof GetAllMonstersQuerySchema, typeof GetAllMonstersResponseSchema>({
        path: '/monsters',
        method: 'GET',
        requestSchema: GetAllMonstersQuerySchema,
        responseSchema: GetAllMonstersResponseSchema,
    }),

    getMonsterById: typedApi<undefined, typeof GetMonsterResponseSchema, typeof MonsterIdParamSchema>({
        path: '/monsters/:id',
        method: 'GET',
        paramsSchema: MonsterIdParamSchema,
        responseSchema: GetMonsterResponseSchema,
    }),

    updateMonster: typedApi<typeof UpdateMonsterSchema, typeof UpdateResponseSchema, typeof MonsterIdParamSchema>({
        path: '/monsters/:id',
        method: 'PUT',
        paramsSchema: MonsterIdParamSchema,
        requestSchema: UpdateMonsterSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteMonster: typedApi<undefined, typeof UpdateResponseSchema, typeof MonsterIdParamSchema>({
        path: '/monsters/:id',
        method: 'DELETE',
        paramsSchema: MonsterIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};

