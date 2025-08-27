import { typedApi } from '@/services/Api';
import {
    SpellIdParamSchema,
    UpdateSpellSchema,
    GetSpellResponseSchema,
    GetAllSpellsResponseSchema,
    UpdateResponseSchema,
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
export const SpellApi = {
    getAllSpells: typedApi({
        path: '/spells',
        method: 'GET',
        responseSchema: GetAllSpellsResponseSchema,
    }),

    // Get spell by ID with path parameter
    getSpellById: typedApi<undefined, typeof GetSpellResponseSchema, typeof SpellIdParamSchema>({
        path: '/spells/:id',
        method: 'GET',
        paramsSchema: SpellIdParamSchema,
        responseSchema: GetSpellResponseSchema,
    }),

    // Update spell with path parameter
    updateSpell: typedApi<typeof UpdateSpellSchema, typeof UpdateResponseSchema, typeof SpellIdParamSchema>({
        path: '/spells/:id',
        method: 'PUT',
        paramsSchema: SpellIdParamSchema,
        requestSchema: UpdateSpellSchema,
        responseSchema: UpdateResponseSchema
    }),

    // Delete spell with path parameter
    deleteSpell: typedApi<undefined, typeof UpdateResponseSchema, typeof SpellIdParamSchema>({
        path: '/spells/:id',
        method: 'DELETE',
        paramsSchema: SpellIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
}; 
