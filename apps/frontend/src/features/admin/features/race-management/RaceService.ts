import { typedApi } from '@/services/Api';
import {
    RaceQuerySchema,
    RaceIdParamSchema,
    UpdateRaceSchema,
    RaceQueryResponseSchema,
    GetRaceResponseSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
} from '@shared/schema';

/**
 * RaceService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get races with query parameters
 * const races = await RaceService.getRaces({ page: 1, limit: 10 });
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
export const RaceService = {
    // Get races with query parameters
    getRaces: typedApi<typeof RaceQuerySchema, typeof RaceQueryResponseSchema>({
        path: '/races',
        method: 'GET',
        requestSchema: RaceQuerySchema,
        responseSchema: RaceQueryResponseSchema,
    }),

    // Get race by ID with path parameter
    getRaceById: typedApi<undefined, typeof GetRaceResponseSchema, typeof RaceIdParamSchema>({
        path: '/races/:id',
        method: 'GET',
        paramsSchema: RaceIdParamSchema,
        responseSchema: GetRaceResponseSchema,
    }),

    // Create race
    createRace: typedApi<typeof GetRaceResponseSchema, typeof CreateResponseSchema>({
        path: '/races',
        method: 'POST',
        requestSchema: GetRaceResponseSchema,
        responseSchema: CreateResponseSchema,
    }),

    // Update race with path parameter
    updateRace: typedApi<typeof UpdateRaceSchema, typeof UpdateResponseSchema, typeof RaceIdParamSchema>({
        path: '/races/:id',
        method: 'PUT',
        requestSchema: UpdateRaceSchema,
        paramsSchema: RaceIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Delete race with path parameter
    deleteRace: typedApi<undefined, typeof UpdateResponseSchema, typeof RaceIdParamSchema>({
        path: '/races/:id',
        method: 'DELETE',
        paramsSchema: RaceIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};
