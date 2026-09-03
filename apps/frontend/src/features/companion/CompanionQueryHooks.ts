import { createQueryHooks } from '@/services/query/QueryHooksFactory';
import {
    CompanionIdParamSchema,
    UpdateCompanionSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllCompanionsResponseSchema,
    CompanionSchema,
    GetCompanionResponseSchema,
    CreateCompanionSchema,
    CreateCharacterCompanionSchema,
    UpdateCharacterCompanionSchema,
    CharacterCompanionIdParamSchema,
    CharacterCompanionCharacterIdParamSchema,
    GetAllCharacterCompanionsResponseSchema,
    GetResolvedCharacterCompanionsResponseSchema,
} from '@shared/schema';


// Create query hook configurations
const companionsConfig = createQueryHooks({
    path: '/companions',
    method: 'GET',
    responseSchema: GetAllCompanionsResponseSchema,
    queryKey: 'companions',
    queryKeyBuilder: () => ['companions', 'list'],
});

// Individual companion query configuration - returns single companion by ID
// Query key: ['companions', 'item', id] - includes ID in key for unique cache entries
const companionByIdConfig = createQueryHooks({
    path: '/companions/:id',
    method: 'GET',
    paramsSchema: CompanionIdParamSchema,
    responseSchema: GetCompanionResponseSchema,
    queryKey: 'companions',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['companions', 'item', typedParams?.pathParams?.id];
    },
});

const createCompanionConfig = createQueryHooks({
    path: '/companions',
    method: 'POST',
    requestSchema: CreateCompanionSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'companions',
});

const updateCompanionConfig = createQueryHooks({
    path: '/companions/:id',
    method: 'PUT',
    requestSchema: UpdateCompanionSchema,
    paramsSchema: CompanionIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'companions',
});

const deleteCompanionConfig = createQueryHooks({
    path: '/companions/:id',
    method: 'DELETE',
    paramsSchema: CompanionIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'companions',
});

/**
 * Companion Query Hooks Export
 * 
 * Provides React hooks and imperative methods for companion-related operations.
 */
export const CompanionQueryHooks = {
    // React hooks for use in components
    useGetCompanions: companionsConfig.useQuery,
    useGetCompanionById: companionByIdConfig.useQuery,
    useCreateCompanion: createCompanionConfig.useMutation,
    useUpdateCompanion: updateCompanionConfig.useMutation,
    useDeleteCompanion: deleteCompanionConfig.useMutation,

    // Add imperative methods
    getCompanions: (params?: unknown) => companionsConfig.fetch(params),
    getCompanionById: (companionId: number) => companionByIdConfig.fetch({ pathParams: { id: companionId } }),
    createCompanion: (data: unknown) => createCompanionConfig.mutate({ requestData: data }),
    updateCompanion: (companionId: number, data: unknown) => updateCompanionConfig.mutate({
        requestData: data,
        pathParams: { id: companionId }
    }),
    deleteCompanion: (companionId: number) => deleteCompanionConfig.mutate({
        pathParams: { id: companionId }
    }),

    // Expose query functions for advanced usage
    getCompanionsQueryFn: companionsConfig.queryFn,
    getCompanionByIdQueryFn: companionByIdConfig.queryFn,
    getCompanionsQueryKey: (params?: unknown) => companionsConfig.queryKeyBuilder(),
    getCompanionByIdQueryKey: (companionId: number) => companionByIdConfig.queryKeyBuilder({ pathParams: { id: companionId } }),
};

// Character-specific companion query configuration
// Query key: ['character-companions', 'list', characterId] - includes characterId for per-character caching
// Note: This query uses a parameter in the key because it's character-specific data
const getCharacterCompanionsConfig = createQueryHooks({
    path: '/companions/character/:characterId',
    method: 'GET',
    paramsSchema: CharacterCompanionCharacterIdParamSchema,
    responseSchema: GetAllCharacterCompanionsResponseSchema,
    queryKey: 'character-companions',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { characterId?: number } } | undefined;
        return ['character-companions', 'list', typedParams?.pathParams?.characterId];
    },
});

const createCharacterCompanionConfig = createQueryHooks({
    path: '/companions/character',
    method: 'POST',
    requestSchema: CreateCharacterCompanionSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'character-companions',
});

const updateCharacterCompanionConfig = createQueryHooks({
    path: '/companions/character/:id',
    method: 'PUT',
    requestSchema: UpdateCharacterCompanionSchema,
    paramsSchema: CharacterCompanionIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'character-companions',
});

const deleteCharacterCompanionConfig = createQueryHooks({
    path: '/companions/character/:id',
    method: 'DELETE',
    paramsSchema: CharacterCompanionIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'character-companions',
});

const getResolvedCharacterCompanionsConfig = createQueryHooks({
    path: '/companions/character/:characterId/resolved',
    method: 'GET',
    paramsSchema: CharacterCompanionCharacterIdParamSchema,
    responseSchema: GetResolvedCharacterCompanionsResponseSchema,
    queryKey: 'character-companions',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { characterId?: number } } | undefined;
        return ['character-companions', 'resolved', typedParams?.pathParams?.characterId];
    },
});

export const CharacterCompanionQueryHooks = {
    useGetCharacterCompanions: getCharacterCompanionsConfig.useQuery,
    useGetResolvedCharacterCompanions: getResolvedCharacterCompanionsConfig.useQuery,
    useCreateCharacterCompanion: createCharacterCompanionConfig.useMutation,
    useUpdateCharacterCompanion: updateCharacterCompanionConfig.useMutation,
    useDeleteCharacterCompanion: deleteCharacterCompanionConfig.useMutation,

    // Add imperative methods
    getCharacterCompanions: (characterId: number) => getCharacterCompanionsConfig.fetch({ pathParams: { characterId } }),
    getResolvedCharacterCompanions: (characterId: number) => getResolvedCharacterCompanionsConfig.fetch({ pathParams: { characterId } }),
    createCharacterCompanion: (data: unknown) => createCharacterCompanionConfig.mutate({ requestData: data }),
    updateCharacterCompanion: (id: number, data: unknown) => updateCharacterCompanionConfig.mutate({
        requestData: data,
        pathParams: { id }
    }),
    deleteCharacterCompanion: (id: number) => deleteCharacterCompanionConfig.mutate({
        pathParams: { id }
    }),

    // Expose query functions for advanced usage
    getCharacterCompanionsQueryFn: getCharacterCompanionsConfig.queryFn,
    getResolvedCharacterCompanionsQueryFn: getResolvedCharacterCompanionsConfig.queryFn,
    getCharacterCompanionsQueryKey: (characterId: number) => getCharacterCompanionsConfig.queryKeyBuilder({ pathParams: { characterId } }),
    getResolvedCharacterCompanionsQueryKey: (characterId: number) => getResolvedCharacterCompanionsConfig.queryKeyBuilder({ pathParams: { characterId } }),
};
