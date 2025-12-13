import {
    MonsterIdParamSchema,
    GetAllMonstersQuerySchema,
    UpdateMonsterSchema,
    GetMonsterResponseSchema,
    GetAllMonstersResponseSchema,
    UpdateResponseSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

export const MonsterQueryHooks = {
    useGetAllMonsters: createQueryHooks({
        path: '/monsters',
        method: 'GET',
        requestSchema: GetAllMonstersQuerySchema,
        responseSchema: GetAllMonstersResponseSchema,
        queryKey: 'monsters',
        queryKeyBuilder: (params) => ['monsters', 'list', params as string | number | object],
    }).useQuery,

    useGetMonsterById: createQueryHooks({
        path: '/monsters/:id',
        method: 'GET',
        paramsSchema: MonsterIdParamSchema,
        responseSchema: GetMonsterResponseSchema,
        queryKey: 'monsters',
        queryKeyBuilder: (params) => {
            const typedParams = params as { pathParams?: { id?: number } } | undefined;
            return ['monsters', 'item', typedParams?.pathParams?.id];
        },
    }).useQuery,

    useUpdateMonster: createQueryHooks({
        path: '/monsters/:id',
        method: 'PUT',
        paramsSchema: MonsterIdParamSchema,
        requestSchema: UpdateMonsterSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'monsters',
    }).useMutation,

    useDeleteMonster: createQueryHooks({
        path: '/monsters/:id',
        method: 'DELETE',
        paramsSchema: MonsterIdParamSchema,
        responseSchema: UpdateResponseSchema,
        queryKey: 'monsters',
    }).useMutation,
};

