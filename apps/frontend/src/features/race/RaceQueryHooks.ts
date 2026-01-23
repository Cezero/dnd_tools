import { createQueryHooks } from '@/services/query/QueryHooksFactory';
import {
    BaseRaceSchema,
    CreateRaceSchema,
    CreateResponseSchema,
    DraftLockStatusSchema,
    GetAllRacesResponseSchema,
    GetFeaturesResponseSchema,
    IdParamSchema,
    UpdateRaceSchema,
    UpdateResponseSchema,
} from '@shared/schema';


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
    paramsSchema: IdParamSchema,
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
    paramsSchema: IdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'races',
});

const deleteRaceConfig = createQueryHooks({
    path: '/races/:id',
    method: 'DELETE',
    paramsSchema: IdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'races',
});

const raceFeaturesConfig = createQueryHooks({
    path: '/races/:id/features',
    method: 'GET',
    paramsSchema: IdParamSchema,
    responseSchema: GetFeaturesResponseSchema,
    queryKey: 'races',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['races', 'features', typedParams?.pathParams?.id];
    },
});

const raceLockStatusConfig = createQueryHooks({
    path: '/races/:id/lock-status',
    method: 'GET',
    paramsSchema: IdParamSchema,
    responseSchema: DraftLockStatusSchema,
    queryKey: 'races',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['races', 'lock-status', typedParams?.pathParams?.id];
    },
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
    getRaceFeatures: (raceId: number) => raceFeaturesConfig.fetch({ pathParams: { id: raceId } }),
    getRaceLockStatus: (raceId: number) => raceLockStatusConfig.fetch({ pathParams: { id: raceId } }),

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
    getRaceFeaturesQueryFn: raceFeaturesConfig.queryFn,
    getRaceLockStatusQueryFn: raceLockStatusConfig.queryFn,
    getRaceFeaturesQueryKey: (raceId: number) => raceFeaturesConfig.queryKeyBuilder({ pathParams: { id: raceId } }),
    getRaceLockStatusQueryKey: (raceId: number) => raceLockStatusConfig.queryKeyBuilder({ pathParams: { id: raceId } }),
};
