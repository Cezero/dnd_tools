import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import {
    DomainIdParamSchema,
    CreateDomainSchema,
    UpdateDomainSchema
} from '@shared/schema';

import {
    GetAllDomains,
    GetDomainById,
    CreateDomain,
    UpdateDomain,
    DeleteDomain,
    GetDomainCache,
} from './domainController.js';
import { requireAdmin } from '../../middleware/authMiddleware.js';

const { router: DomainRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

// Domain Read Routes
get('/', {}, GetAllDomains);
get('/cache', {}, GetDomainCache);
get('/:id', { params: DomainIdParamSchema }, GetDomainById);

// Domain Write Routes
post('/', requireAdmin, { body: CreateDomainSchema }, CreateDomain);
put('/:id', requireAdmin, { params: DomainIdParamSchema, body: UpdateDomainSchema }, UpdateDomain);
deleteRoute('/:id', requireAdmin, { params: DomainIdParamSchema }, DeleteDomain);

export { DomainRouter };
