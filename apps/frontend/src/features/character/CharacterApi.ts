import { typedApi } from '@/services/Api';
import {
    CharacterIdParamSchema,
    CreateCharacterSchema,
    UpdateCharacterSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    CharacterSchema,
    GetAllCharactersResponseSchema,
} from '@shared/schema';

/**
 * CharacterService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get characters for current user
 * const characters = await CharacterService.getCharacters();
 * 
 * // Get character by ID (path parameter)
 * const character = await CharacterService.getCharacterById(undefined, { id: 123 });
 * 
 * // Create character
 * const newCharacter = await CharacterService.createCharacter({ name: "Aragorn", raceId: 1, alignmentId: 1 });
 * 
 * // Update character (path parameter + body)
 * const updatedCharacter = await CharacterService.updateCharacter(
 *   { name: "Updated Aragorn" }, 
 *   { id: 123 }
 * );
 * 
 * // Delete character (path parameter)
 * await CharacterService.deleteCharacter(undefined, { id: 123 });
 */
export const CharacterApi = {
    getCharacters: typedApi({
        path: '/characters',
        method: 'GET',
        responseSchema: GetAllCharactersResponseSchema,
    }),

    getCharacterById: typedApi<undefined, typeof CharacterSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id',
        method: 'GET',
        paramsSchema: CharacterIdParamSchema,
        responseSchema: CharacterSchema,
    }),

    createCharacter: typedApi<typeof CreateCharacterSchema, typeof CreateResponseSchema>({
        path: '/characters',
        method: 'POST',
        requestSchema: CreateCharacterSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateCharacter: typedApi<typeof UpdateCharacterSchema, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id',
        method: 'PUT',
        requestSchema: UpdateCharacterSchema,
        responseSchema: UpdateResponseSchema,
        paramsSchema: CharacterIdParamSchema,
    }),

    deleteCharacter: typedApi<undefined, typeof UpdateResponseSchema, typeof CharacterIdParamSchema>({
        path: '/characters/:id',
        method: 'DELETE',
        paramsSchema: CharacterIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
}; 
