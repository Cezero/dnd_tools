import { typedApi } from '@/services/Api';
import {
    RaceIdParamSchema,
    UpdateRaceSchema,
    GetRaceResponseSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    GetAllRacesResponseSchema,
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
export const RaceService = {
    getRaces: typedApi({
        path: '/races',
        method: 'GET',
        responseSchema: GetAllRacesResponseSchema,
    }),

    getRaceById: typedApi<undefined, typeof GetRaceResponseSchema, typeof RaceIdParamSchema>({
        path: '/races/:id',
        method: 'GET',
        paramsSchema: RaceIdParamSchema,
        responseSchema: GetRaceResponseSchema,
    }),

    createRace: typedApi<typeof GetRaceResponseSchema, typeof CreateResponseSchema>({
        path: '/races',
        method: 'POST',
        requestSchema: GetRaceResponseSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateRace: typedApi<typeof UpdateRaceSchema, typeof UpdateResponseSchema, typeof RaceIdParamSchema>({
        path: '/races/:id',
        method: 'PUT',
        requestSchema: UpdateRaceSchema,
        paramsSchema: RaceIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteRace: typedApi<undefined, typeof UpdateResponseSchema, typeof RaceIdParamSchema>({
        path: '/races/:id',
        method: 'DELETE',
        paramsSchema: RaceIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};
