import {
    CharacterIdParamSchema,
    CreateCharacterSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    CharacterSchema,
    GetAllCharactersResponseSchema,
    CharacterWithAllDetailsSchema,
    CharacterSpellSelectionResponseSchema,
    CharacterSpellSelectionParamSchema,
    AddSpellKnownRequestSchema,
    AddSpellKnownResponseSchema,
    RemoveSpellKnownRequestSchema,
    RemoveSpellKnownResponseSchema,
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

const getAllCharactersAdminConfig = createQueryHooks({
    path: '/characters/admin/all',
    method: 'GET',
    responseSchema: GetAllCharactersResponseSchema,
    queryKey: 'characters',
    queryKeyBuilder: () => ['characters', 'admin', 'all'],
});

const getCharacterSpellSelectionConfig = createQueryHooks({
    path: '/characters/:id/spell-selection/:classId',
    method: 'GET',
    paramsSchema: CharacterSpellSelectionParamSchema,
    responseSchema: CharacterSpellSelectionResponseSchema,
    queryKey: 'characters',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number; classId?: string } } | undefined;
        return ['characters', 'spell-selection', typedParams?.pathParams?.id, typedParams?.pathParams?.classId];
    },
});

const addSpellKnownConfig = createQueryHooks({
    path: '/characters/spell-selection/add',
    method: 'POST',
    requestSchema: AddSpellKnownRequestSchema,
    responseSchema: AddSpellKnownResponseSchema,
    queryKey: 'characters',
});

const removeSpellKnownConfig = createQueryHooks({
    path: '/characters/spell-selection/remove',
    method: 'POST',
    requestSchema: RemoveSpellKnownRequestSchema,
    responseSchema: RemoveSpellKnownResponseSchema,
    queryKey: 'characters',
});

export const CharacterQueryHooks = {
    useGetCharacters: charactersConfig.useQuery,
    useGetAllCharactersAdmin: getAllCharactersAdminConfig.useQuery,
    useGetCharacterById: characterByIdConfig.useQuery,
    useGetCharacterWithAllDetails: characterWithAllDetailsConfig.useQuery,
    useCreateCharacter: createCharacterConfig.useMutation,
    useDeleteCharacter: deleteCharacterConfig.useMutation,

    // Add imperative methods
    getCharacters: (params?: unknown) => charactersConfig.fetch(params),
    getAllCharactersAdmin: () => getAllCharactersAdminConfig.fetch(),
    getCharacterById: (characterId: number) => characterByIdConfig.fetch({ pathParams: { id: characterId } }),
    getCharacterWithAllDetails: (characterId: number) => characterWithAllDetailsConfig.fetch({ pathParams: { id: characterId } }),
    createCharacter: (data: unknown) => createCharacterConfig.mutate({ requestData: data }),
    deleteCharacter: (characterId: number) => deleteCharacterConfig.mutate({
        pathParams: { id: characterId }
    }),

    // Expose query functions for advanced usage
    getCharactersQueryFn: charactersConfig.queryFn,
    getAllCharactersAdminQueryFn: getAllCharactersAdminConfig.queryFn,
    getCharacterByIdQueryFn: characterByIdConfig.queryFn,
    getCharacterWithAllDetailsQueryFn: characterWithAllDetailsConfig.queryFn,
    getCharactersQueryKey: (params?: unknown) => charactersConfig.queryKeyBuilder(params),
    getAllCharactersAdminQueryKey: () => getAllCharactersAdminConfig.queryKeyBuilder(),
    getCharacterByIdQueryKey: (characterId: number) => characterByIdConfig.queryKeyBuilder({ pathParams: { id: characterId } }),
    getCharacterWithAllDetailsQueryKey: (characterId: number) => characterWithAllDetailsConfig.queryKeyBuilder({ pathParams: { id: characterId } }),

    // Spell selection hooks
    useGetCharacterSpellSelection: (characterId: number, classId: number, options?: unknown) => {
        return getCharacterSpellSelectionConfig.useQuery(
            { pathParams: { id: characterId, classId: classId.toString() } },
            options
        );
    },
    useAddSpellKnown: addSpellKnownConfig.useMutation,
    useRemoveSpellKnown: removeSpellKnownConfig.useMutation,

    getCharacterSpellSelection: (characterId: number, classId: number) => getCharacterSpellSelectionConfig.fetch({ pathParams: { id: characterId, classId: classId.toString() } }),
    addSpellKnown: (data: unknown, queryClient?: any) => addSpellKnownConfig.mutate({ requestData: data }, queryClient),
    removeSpellKnown: (data: unknown, queryClient?: any) => removeSpellKnownConfig.mutate({ requestData: data }, queryClient),

    getCharacterSpellSelectionQueryFn: getCharacterSpellSelectionConfig.queryFn,
    getCharacterSpellSelectionQueryKey: (characterId: number, classId: number) => getCharacterSpellSelectionConfig.queryKeyBuilder({ pathParams: { id: characterId, classId: classId.toString() } }),
};
