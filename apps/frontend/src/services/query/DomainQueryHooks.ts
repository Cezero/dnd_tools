import {
    DomainIdParamSchema,
    UpdateDomainSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllDomainsResponseSchema,
    DomainSchema,
    CreateDomainSchema,
} from '@shared/schema';

import { createQueryHooks } from './QueryHooksFactory';

// Create query hook configurations
const domainsConfig = createQueryHooks({
    path: '/domains',
    method: 'GET',
    responseSchema: GetAllDomainsResponseSchema,
    queryKey: 'domains',
    queryKeyBuilder: (params) => ['domains', 'list', params as string | number | object],
});

const domainByIdConfig = createQueryHooks({
    path: '/domains/:id',
    method: 'GET',
    paramsSchema: DomainIdParamSchema,
    responseSchema: DomainSchema,
    queryKey: 'domains',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['domains', 'item', typedParams?.pathParams?.id];
    },
});

const createDomainConfig = createQueryHooks({
    path: '/domains',
    method: 'POST',
    requestSchema: CreateDomainSchema,
    responseSchema: CreateResponseSchema,
    queryKey: 'domains',
});

const updateDomainConfig = createQueryHooks({
    path: '/domains/:id',
    method: 'PUT',
    requestSchema: UpdateDomainSchema,
    paramsSchema: DomainIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'domains',
});

const deleteDomainConfig = createQueryHooks({
    path: '/domains/:id',
    method: 'DELETE',
    paramsSchema: DomainIdParamSchema,
    responseSchema: UpdateResponseSchema,
    queryKey: 'domains',
});

export const DomainQueryHooks = {
    // Keep existing hooks for backward compatibility during transition
    useGetDomains: domainsConfig.useQuery,
    useGetDomainById: domainByIdConfig.useQuery,
    useCreateDomain: createDomainConfig.useMutation,
    useUpdateDomain: updateDomainConfig.useMutation,
    useDeleteDomain: deleteDomainConfig.useMutation,

    // Add imperative methods
    getDomains: (params?: unknown) => domainsConfig.fetch(params),
    getDomainById: (domainId: number) => domainByIdConfig.fetch({ pathParams: { id: domainId } }),
    createDomain: (data: unknown) => createDomainConfig.mutate({ requestData: data }),
    updateDomain: (domainId: number, data: unknown) => updateDomainConfig.mutate({
        requestData: data,
        pathParams: { id: domainId }
    }),
    deleteDomain: (domainId: number) => deleteDomainConfig.mutate({
        pathParams: { id: domainId }
    }),

    // Expose query functions for advanced usage
    getDomainsQueryFn: domainsConfig.queryFn,
    getDomainByIdQueryFn: domainByIdConfig.queryFn,
    getDomainsQueryKey: (params?: unknown) => domainsConfig.queryKeyBuilder(params),
    getDomainByIdQueryKey: (domainId: number) => domainByIdConfig.queryKeyBuilder({ pathParams: { id: domainId } }),
};
