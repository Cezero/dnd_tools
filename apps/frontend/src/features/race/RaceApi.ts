import { typedApi } from '@/services/Api';
import {
    BaseRaceSchema,
    CreateRaceSchema,
    CreateResponseSchema,
    DraftLockStatusSchema,
    GetFeaturesResponseSchema,
    GetAllRacesResponseSchema,
    IdParamSchema,
    UpdateRaceSchema,
    UpdateResponseSchema,
} from '@shared/schema';

/**
 * RaceService with path parameter support
 * 
 * Usage examples:
 *
 * // Get race by ID (path parameter)
 * const race = await RaceService.getRaceById(undefined, { id: 123 });
 * 
 * // Create race
 * const newRace = await RaceService.createRace({ name: "Human", sizeId: 5 });
 * 
 * // Update race (path parameter + body)
 * const updatedRace = await RaceService.updateRace(
 *   { name: "Updated Human" }, 
 *   { id: 123 }
 * );
 * 
 * // Delete race (path parameter)
 * await RaceService.deleteRace(undefined, { id: 123 });
 */
export const RaceApi = {
    getRaces: typedApi({
        path: '/races',
        method: 'GET',
        responseSchema: GetAllRacesResponseSchema,
    }),

    getRaceById: typedApi<undefined, typeof BaseRaceSchema, typeof IdParamSchema>({
        path: '/races/:id',
        method: 'GET',
        paramsSchema: IdParamSchema,
        responseSchema: BaseRaceSchema,
    }),

    getRaceFeatures: typedApi<undefined, typeof GetFeaturesResponseSchema, typeof IdParamSchema>({
        path: '/races/:id/features',
        method: 'GET',
        paramsSchema: IdParamSchema,
        responseSchema: GetFeaturesResponseSchema,
    }),

    createRace: typedApi<typeof CreateRaceSchema, typeof CreateResponseSchema>({
        path: '/races',
        method: 'POST',
        requestSchema: CreateRaceSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateRace: typedApi<typeof UpdateRaceSchema, typeof UpdateResponseSchema, typeof IdParamSchema>({
        path: '/races/:id',
        method: 'PUT',
        requestSchema: UpdateRaceSchema,
        paramsSchema: IdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteRace: typedApi<undefined, typeof UpdateResponseSchema, typeof IdParamSchema>({
        path: '/races/:id',
        method: 'DELETE',
        paramsSchema: IdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    getRaceLockStatus: typedApi<undefined, typeof DraftLockStatusSchema, typeof IdParamSchema>({
        path: '/races/:id/lock-status',
        method: 'GET',
        paramsSchema: IdParamSchema,
        responseSchema: DraftLockStatusSchema,
    }),
};
