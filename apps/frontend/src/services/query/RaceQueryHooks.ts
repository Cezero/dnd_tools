import {
    RaceIdParamSchema,
    UpdateRaceSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    GetAllRacesResponseSchema,
    BaseRaceSchema,
    CreateRaceSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

// Create query hook configurations
const racesConfig = createQueryHooks({
    path: '/races',
    method: 'GET',
    responseSchema: GetAllRacesResponseSchema,
    queryKey: 'races',
    queryKeyBuilder: (params) => ['races', 'list', params as string | number | object],
});

const raceByIdConfig = createQueryHooks({
    path: '/races/:id',
    method: 'GET',
    paramsSchema: RaceIdParamSchema,
    responseSchema: BaseRaceSchema,
    queryKey: 'races',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['races', 'item', typedParams?.pathParams?.id];
    },
});

const createRaceConfig = createQueryHooks({
    path: '/races',
    method: 'POST',
    requestSchema: CreateRaceSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'races',
});

const updateRaceConfig = createQueryHooks({
    path: '/races/:id',
    method: 'PUT',
    requestSchema: UpdateRaceSchema,
    paramsSchema: RaceIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'races',
});

const deleteRaceConfig = createQueryHooks({
    path: '/races/:id',
    method: 'DELETE',
    paramsSchema: RaceIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'races',
});

export const RaceQueryHooks = {
    // Keep existing hooks for backward compatibility during transition
    useGetRaces: racesConfig.useQuery,
    useGetRaceById: raceByIdConfig.useQuery,
    useCreateRace: createRaceConfig.useMutation,
    useUpdateRace: updateRaceConfig.useMutation,
    useDeleteRace: deleteRaceConfig.useMutation,

    // Add imperative methods
    getRaces: (params?: unknown) => racesConfig.fetch(params),
    getRaceById: (raceId: number) => raceByIdConfig.fetch({ pathParams: { id: raceId } }),
    createRace: (data: unknown) => createRaceConfig.mutate({ requestData: data }),
    updateRace: (raceId: number, data: unknown) => updateRaceConfig.mutate({
        requestData: data,
        pathParams: { id: raceId }
    }),
    deleteRace: (raceId: number) => deleteRaceConfig.mutate({
        pathParams: { id: raceId }
    }),

    // Expose query functions for advanced usage
    getRacesQueryFn: racesConfig.queryFn,
    getRaceByIdQueryFn: raceByIdConfig.queryFn,
    getRacesQueryKey: (params?: unknown) => racesConfig.queryKeyBuilder(params),
    getRaceByIdQueryKey: (raceId: number) => raceByIdConfig.queryKeyBuilder({ pathParams: { id: raceId } }),
};
