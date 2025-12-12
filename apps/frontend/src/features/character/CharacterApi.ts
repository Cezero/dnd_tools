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
