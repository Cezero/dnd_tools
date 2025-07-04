import { z } from 'zod';

import { typedApi } from '@/services/Api';
import {
    SpellQuerySchema,
    SpellIdParamSchema,
    UpdateSpellSchema,
    SpellQueryResponseSchema,
    GetSpellResponseSchema,
} from '@shared/schema';

/**
 * SpellService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get spells with query parameters
 * const spells = await SpellService.getSpells({ page: 1, limit: 10 });
 * 
 * // Get spell by ID (path parameter)
 * const spell = await SpellService.getSpellById(undefined, { id: 123 });
 * 
 * // Create spell
 * const newSpell = await SpellService.createSpell({ name: "Magic Missile", baseLevel: 1 });
 * 
 * // Update spell (path parameter + body)
 * const updatedSpell = await SpellService.updateSpell(
 *   { name: "Updated Magic Missile" }, 
 *   { id: 123 }
 * );
 * 
 * // Delete spell (path parameter)
 * await SpellService.deleteSpell(undefined, { id: 123 });
 */
export const SpellService = {
    // Get spells with query parameters
    getSpells: typedApi<typeof SpellQuerySchema, typeof SpellQueryResponseSchema>({
        path: '/spells',
        method: 'GET',
        requestSchema: SpellQuerySchema,
        responseSchema: SpellQueryResponseSchema,
    }),

    // Get spell by ID with path parameter
    getSpellById: typedApi<undefined, typeof GetSpellResponseSchema, typeof SpellIdParamSchema>({
        path: '/spells/:id',
        method: 'GET',
        paramsSchema: SpellIdParamSchema,
        responseSchema: GetSpellResponseSchema,
    }),

    // Update spell with path parameter
    updateSpell: typedApi<typeof UpdateSpellSchema, z.ZodObject<Record<string, never>>, typeof SpellIdParamSchema>({
        path: '/spells/:id',
        method: 'PUT',
        paramsSchema: SpellIdParamSchema,
        requestSchema: UpdateSpellSchema,
        responseSchema: z.object({})
    }),

    // Delete spell with path parameter
    deleteSpell: typedApi<undefined, z.ZodObject<Record<string, never>>, typeof SpellIdParamSchema>({
        path: '/spells/:id',
        method: 'DELETE',
        paramsSchema: SpellIdParamSchema,
        responseSchema: z.object({}),
    }),
}; 