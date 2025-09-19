import { typedApi } from '@/services/Api';
import {
    SpellIdParamSchema,
    SpellClassParamSchema,
    UpdateSpellSchema,
    GetSpellResponseSchema,
    GetAllSpellsResponseSchema,
    UpdateResponseSchema,
} from '@shared/schema';

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

    // Get spells for class (base class or variant)
    getSpellsForClass: typedApi<undefined, typeof GetAllSpellsResponseSchema, typeof SpellClassParamSchema>({
        path: '/spells/class/:classId',
        method: 'GET',
        paramsSchema: SpellClassParamSchema,
        responseSchema: GetAllSpellsResponseSchema,
    }),
}; 
