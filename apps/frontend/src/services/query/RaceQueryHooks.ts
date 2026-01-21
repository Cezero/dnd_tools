import {
    RaceIdParamSchema,
    RaceIdQuerySchema,
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
    // Imperative methods
    getRaces: (params?: unknown) => racesConfig.fetch(params),
    getRaceById: (raceId: number, characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>) => {
        const queryParams: { characterFeatureChoices?: string } = {};
        if (characterFeatureChoices && characterFeatureChoices.length > 0) {
            queryParams.characterFeatureChoices = JSON.stringify(characterFeatureChoices);
        }
        return raceByIdConfig.fetch({
            pathParams: { id: raceId },
            requestData: Object.keys(queryParams).length > 0 ? queryParams : undefined
        });
    },
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
    getRaceByIdQueryFn: (params: { pathParams: { id: number }; queryParams?: { characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }> } }) => {
        const queryData: { characterFeatureChoices?: string } = {};
        if (params.queryParams?.characterFeatureChoices && params.queryParams.characterFeatureChoices.length > 0) {
            queryData.characterFeatureChoices = JSON.stringify(params.queryParams.characterFeatureChoices);
        }
        return raceByIdConfig.queryFn({
            pathParams: params.pathParams,
            requestData: Object.keys(queryData).length > 0 ? queryData : undefined
        });
    },
    getRacesQueryKey: (params?: unknown) => racesConfig.queryKeyBuilder(params),
    getRaceByIdQueryKey: (raceId: number) => raceByIdConfig.queryKeyBuilder({ pathParams: { id: raceId } }),
};
