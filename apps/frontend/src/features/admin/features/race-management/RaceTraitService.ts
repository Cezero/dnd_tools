import { z } from 'zod';

import { typedApi } from '@/services/Api';
import {
    RaceTraitQuerySchema,
    RaceTraitSlugParamSchema,
    CreateRaceTraitSchema,
    UpdateRaceTraitSchema,
    RaceTraitSchema,
    RaceTraitQueryResponseSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
} from '@shared/schema';

/**
 * RaceTraitService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get race traits with query parameters
 * const traits = await RaceTraitService.getRaceTraits({ page: 1, limit: 10 });
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
    // Get race traits with query parameters
    getRaceTraits: typedApi<typeof RaceTraitQuerySchema, typeof RaceTraitQueryResponseSchema>({
        path: '/races/traits',
        method: 'GET',
        requestSchema: RaceTraitQuerySchema,
        responseSchema: RaceTraitQueryResponseSchema
    }),

    // Get race trait by slug with path parameter
    getRaceTraitBySlug: typedApi<undefined, typeof RaceTraitSchema, typeof RaceTraitSlugParamSchema>({
        path: '/races/traits/:slug',
        method: 'GET',
        paramsSchema: RaceTraitSlugParamSchema,
        responseSchema: RaceTraitSchema,
    }),

    // Create race trait
    createRaceTrait: typedApi<typeof CreateRaceTraitSchema, typeof CreateResponseSchema>({
        path: '/races/traits',
        method: 'POST',
        requestSchema: CreateRaceTraitSchema,
        responseSchema: CreateResponseSchema,
    }),

    // Update race trait with path parameter
    updateRaceTrait: typedApi<typeof UpdateRaceTraitSchema, typeof UpdateResponseSchema, typeof RaceTraitSlugParamSchema>({
        path: '/races/traits/:slug',
        method: 'PUT',
        requestSchema: UpdateRaceTraitSchema,
        paramsSchema: RaceTraitSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Delete race trait with path parameter
    deleteRaceTrait: typedApi<undefined, typeof UpdateResponseSchema, typeof RaceTraitSlugParamSchema>({
        path: '/races/traits/:slug',
        method: 'DELETE',
        paramsSchema: RaceTraitSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};
