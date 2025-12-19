import {
    CharacterIdParamSchema,
    CreateCharacterSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    CharacterSchema,
    GetAllCharactersResponseSchema,
    CharacterWithAllDetailsSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

// Create query hook configurations
const charactersConfig = createQueryHooks({
    path: '/characters',
    method: 'GET',
    responseSchema: GetAllCharactersResponseSchema,
    queryKey: 'characters',
    queryKeyBuilder: (params) => ['characters', 'list', params as string | number | object],
});

const characterByIdConfig = createQueryHooks({
    path: '/characters/:id',
    method: 'GET',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: CharacterSchema,
    queryKey: 'characters',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['characters', 'item', typedParams?.pathParams?.id];
    },
});

const createCharacterConfig = createQueryHooks({
    path: '/characters',
    method: 'POST',
    requestSchema: CreateCharacterSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'characters',
});

const deleteCharacterConfig = createQueryHooks({
    path: '/characters/:id',
    method: 'DELETE',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'characters',
});

const characterWithAllDetailsConfig = createQueryHooks({
    path: '/characters/:id/details',
    method: 'GET',
    paramsSchema: CharacterIdParamSchema,
    responseSchema: CharacterWithAllDetailsSchema,
    queryKey: 'characters',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['characters', 'details', typedParams?.pathParams?.id];
    },
});

export const CharacterQueryHooks = {
    useGetCharacters: charactersConfig.useQuery,
    useGetCharacterById: characterByIdConfig.useQuery,
    useGetCharacterWithAllDetails: characterWithAllDetailsConfig.useQuery,
    useCreateCharacter: createCharacterConfig.useMutation,
    useDeleteCharacter: deleteCharacterConfig.useMutation,

    // Add imperative methods
    getCharacters: (params?: unknown) => charactersConfig.fetch(params),
    getCharacterById: (characterId: number) => characterByIdConfig.fetch({ pathParams: { id: characterId } }),
    getCharacterWithAllDetails: (characterId: number) => characterWithAllDetailsConfig.fetch({ pathParams: { id: characterId } }),
    createCharacter: (data: unknown) => createCharacterConfig.mutate({ requestData: data }),
    deleteCharacter: (characterId: number) => deleteCharacterConfig.mutate({
        pathParams: { id: characterId }
    }),

    // Expose query functions for advanced usage
    getCharactersQueryFn: charactersConfig.queryFn,
    getCharacterByIdQueryFn: characterByIdConfig.queryFn,
    getCharacterWithAllDetailsQueryFn: characterWithAllDetailsConfig.queryFn,
    getCharactersQueryKey: (params?: unknown) => charactersConfig.queryKeyBuilder(params),
    getCharacterByIdQueryKey: (characterId: number) => characterByIdConfig.queryKeyBuilder({ pathParams: { id: characterId } }),
    getCharacterWithAllDetailsQueryKey: (characterId: number) => characterWithAllDetailsConfig.queryKeyBuilder({ pathParams: { id: characterId } }),
};
