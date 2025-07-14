import { z } from 'zod';

import { typedApi } from '@/services/Api';
import {
    RaceTraitSlugParamSchema,
    CreateRaceTraitSchema,
    UpdateRaceTraitSchema,
    RaceTraitSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    GetAllRaceTraitsResponseSchema,
} from '@shared/schema';

/**
 * RaceTraitService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get race trait by slug (path parameter)
 * const trait = await RaceTraitService.getRaceTraitBySlug(undefined, { slug: "darkvision" });
 * 
 * // Create race trait
 * const newTrait = await RaceTraitService.createRaceTrait({ slug: "darkvision", name: "Darkvision" });
 * 
 * // Update race trait (path parameter + body)
 * const updatedTrait = await RaceTraitService.updateRaceTrait(
 *   { name: "Updated Darkvision" }, 
 *   { slug: "darkvision" }
 * );
 * 
 * // Delete race trait (path parameter)
 * await RaceTraitService.deleteRaceTrait(undefined, { slug: "darkvision" });
 */
export const RaceTraitService = {
    getRaceTraits: typedApi({
        path: '/races/traits',
        method: 'GET',
        responseSchema: GetAllRaceTraitsResponseSchema
    }),

    getRaceTraitBySlug: typedApi<undefined, typeof RaceTraitSchema, typeof RaceTraitSlugParamSchema>({
        path: '/races/traits/:slug',
        method: 'GET',
        paramsSchema: RaceTraitSlugParamSchema,
        responseSchema: RaceTraitSchema,
    }),

    createRaceTrait: typedApi<typeof CreateRaceTraitSchema, typeof CreateResponseSchema>({
        path: '/races/traits',
        method: 'POST',
        requestSchema: CreateRaceTraitSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateRaceTrait: typedApi<typeof UpdateRaceTraitSchema, typeof UpdateResponseSchema, typeof RaceTraitSlugParamSchema>({
        path: '/races/traits/:slug',
        method: 'PUT',
        requestSchema: UpdateRaceTraitSchema,
        paramsSchema: RaceTraitSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteRaceTrait: typedApi<undefined, typeof UpdateResponseSchema, typeof RaceTraitSlugParamSchema>({
        path: '/races/traits/:slug',
        method: 'DELETE',
        paramsSchema: RaceTraitSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};
