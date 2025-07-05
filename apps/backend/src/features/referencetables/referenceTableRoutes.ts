import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    ReferenceTableQuerySchema,
    ReferenceTableSlugParamSchema,
    ReferenceTableUpdateSchema
} from '@shared/schema';

import {
    GetReferenceTables,
    GetReferenceTable,
    CreateReferenceTable,
    UpdateReferenceTable,
    DeleteReferenceTable,
    GetReferenceTableSummary,
} from './referenceTableController.js';

const { router: ReferenceTableRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

get('/', { query: ReferenceTableQuerySchema }, GetReferenceTables);

get('/:slug', { params: ReferenceTableSlugParamSchema }, GetReferenceTable);

get('/:slug/summary', { params: ReferenceTableSlugParamSchema }, GetReferenceTableSummary);

post('/', requireAdmin, { body: ReferenceTableUpdateSchema }, CreateReferenceTable);

put('/:slug', requireAdmin, { params: ReferenceTableSlugParamSchema, body: ReferenceTableUpdateSchema }, UpdateReferenceTable);

deleteRoute('/:slug', requireAdmin, { params: ReferenceTableSlugParamSchema }, DeleteReferenceTable);

export { ReferenceTableRouter };