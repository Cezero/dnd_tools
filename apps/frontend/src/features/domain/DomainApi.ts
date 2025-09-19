import { typedApi } from '@/services/Api';
import {
    DomainIdParamSchema,
    UpdateDomainSchema,
    UpdateResponseSchema,
    CreateResponseSchema,
    GetAllDomainsResponseSchema,
    DomainSchema,
    CreateDomainSchema,
} from '@shared/schema';

export const DomainApi = {
    getDomains: typedApi({
        path: '/domains',
        method: 'GET',
        responseSchema: GetAllDomainsResponseSchema,
    }),

    getDomainById: typedApi<undefined, typeof DomainSchema, typeof DomainIdParamSchema>({
        path: '/domains/:id',
        method: 'GET',
        paramsSchema: DomainIdParamSchema,
        responseSchema: DomainSchema,
    }),

    createDomain: typedApi<typeof CreateDomainSchema, typeof CreateResponseSchema>({
        path: '/domains',
        method: 'POST',
        requestSchema: CreateDomainSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateDomain: typedApi<typeof UpdateDomainSchema, typeof UpdateResponseSchema, typeof DomainIdParamSchema>({
        path: '/domains/:id',
        method: 'PUT',
        requestSchema: UpdateDomainSchema,
        responseSchema: UpdateResponseSchema,
        paramsSchema: DomainIdParamSchema,
    }),

    deleteDomain: typedApi<undefined, typeof UpdateResponseSchema, typeof DomainIdParamSchema>({
        path: '/domains/:id',
        method: 'DELETE',
        paramsSchema: DomainIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};
