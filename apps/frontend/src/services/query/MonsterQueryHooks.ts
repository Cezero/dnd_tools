import {
    MonsterIdParamSchema,
    GetAllMonstersQuerySchema,
    UpdateMonsterSchema,
    GetMonsterResponseSchema,
    GetAllMonstersResponseSchema,
    UpdateResponseSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

const getAllMonstersConfig = createQueryHooks({
    path: '/monsters',
    method: 'GET',
    requestSchema: GetAllMonstersQuerySchema,
    responseSchema: GetAllMonstersResponseSchema,
    queryKey: 'monsters',
    queryKeyBuilder: (params) => ['monsters', 'list', params as string | number | object],
});

const getMonsterByIdConfig = createQueryHooks({
    path: '/monsters/:id',
    method: 'GET',
    paramsSchema: MonsterIdParamSchema,
    responseSchema: GetMonsterResponseSchema,
    queryKey: 'monsters',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['monsters', 'item', typedParams?.pathParams?.id];
    },
});

const updateMonsterConfig = createQueryHooks({
    path: '/monsters/:id',
    method: 'PUT',
    paramsSchema: MonsterIdParamSchema,
    requestSchema: UpdateMonsterSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'monsters',
});

const deleteMonsterConfig = createQueryHooks({
    path: '/monsters/:id',
    method: 'DELETE',
    paramsSchema: MonsterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'monsters',
});

export const MonsterQueryHooks = {
    useGetAllMonsters: getAllMonstersConfig.useQuery,
    useGetMonsterById: getMonsterByIdConfig.useQuery,
    useUpdateMonster: updateMonsterConfig.useMutation,
    useDeleteMonster: deleteMonsterConfig.useMutation,

    // Imperative methods
    getAllMonsters: (params?: unknown) => getAllMonstersConfig.fetch(params),
    getMonsterById: (monsterId: number) => getMonsterByIdConfig.fetch({ pathParams: { id: monsterId } }),
    updateMonster: (monsterId: number, data: unknown) => updateMonsterConfig.mutate({
        requestData: data,
        pathParams: { id: monsterId }
    }),
    deleteMonster: (monsterId: number) => deleteMonsterConfig.mutate({
        pathParams: { id: monsterId }
    }),
};

