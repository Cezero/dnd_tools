import { createQueryHooks } from '@/services/query/QueryHooksFactory';
import {
    CreateTrickPurposeSchema,
    GetAllTrickPurposesResponseSchema,
    GetTrickPurposeResponseSchema,
    TrickPurposeIdParamSchema,
    UpdateResponseSchema,
    UpdateTrickPurposeSchema,
} from '@shared/schema';

const trickPurposesConfig = createQueryHooks({
    path: '/trick-purposes',
    method: 'GET',
    responseSchema: GetAllTrickPurposesResponseSchema,
    queryKey: 'trick-purposes',
    queryKeyBuilder: (params) => ['trick-purposes', 'list', params as string | number | object],
});

const trickPurposeByIdConfig = createQueryHooks({
    path: '/trick-purposes/:id',
    method: 'GET',
    paramsSchema: TrickPurposeIdParamSchema,
    responseSchema: GetTrickPurposeResponseSchema,
    queryKey: 'trick-purposes',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['trick-purposes', 'item', typedParams?.pathParams?.id];
    },
});

const createTrickPurposeConfig = createQueryHooks({
    path: '/trick-purposes',
    method: 'POST',
    requestSchema: CreateTrickPurposeSchema,
    responseSchema: GetTrickPurposeResponseSchema,
    queryKey: 'trick-purposes',
});

const updateTrickPurposeConfig = createQueryHooks({
    path: '/trick-purposes/:id',
    method: 'PUT',
    requestSchema: UpdateTrickPurposeSchema,
    paramsSchema: TrickPurposeIdParamSchema,
    responseSchema: GetTrickPurposeResponseSchema,
    queryKey: 'trick-purposes',
});

const deleteTrickPurposeConfig = createQueryHooks({
    path: '/trick-purposes/:id',
    method: 'DELETE',
    paramsSchema: TrickPurposeIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'trick-purposes',
});

/**
 * Admin CRUD hooks for Handle Animal purpose packages.
 */
export const TrickPurposeQueryHooks = {
    useGetTrickPurposes: trickPurposesConfig.useQuery,
    useGetTrickPurposeById: trickPurposeByIdConfig.useQuery,
    useCreateTrickPurpose: createTrickPurposeConfig.useMutation,
    useUpdateTrickPurpose: updateTrickPurposeConfig.useMutation,
    useDeleteTrickPurpose: deleteTrickPurposeConfig.useMutation,

    getTrickPurposes: (params?: unknown) => trickPurposesConfig.fetch(params),
    getTrickPurposeById: (id: number) => trickPurposeByIdConfig.fetch({ pathParams: { id } }),
    createTrickPurpose: (data: unknown) => createTrickPurposeConfig.mutate({ requestData: data }),
    updateTrickPurpose: (id: number, data: unknown) => updateTrickPurposeConfig.mutate({
        requestData: data,
        pathParams: { id },
    }),
    deleteTrickPurpose: (id: number) => deleteTrickPurposeConfig.mutate({
        pathParams: { id },
    }),
};
