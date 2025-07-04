import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    ReferenceTableQuerySchema,
    UpdateReferenceTableSchema,
    ReferenceTableSlugParamSchema
} from '@shared/schema';

import {
    GetReferenceTables,
    GetReferenceTable,
    CreateReferenceTable,
    UpdateReferenceTable,
    DeleteReferenceTable,
} from './referenceTableController.js';

const { router: ReferenceTableRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

get('/', { query: ReferenceTableQuerySchema }, GetReferenceTables);

get('/:slug', { params: ReferenceTableSlugParamSchema }, GetReferenceTable);

post('/', requireAdmin, { body: UpdateReferenceTableSchema }, CreateReferenceTable);

put('/:slug', requireAdmin, { params: ReferenceTableSlugParamSchema, body: UpdateReferenceTableSchema }, UpdateReferenceTable);

deleteRoute('/:slug', requireAdmin, { params: ReferenceTableSlugParamSchema }, DeleteReferenceTable);

export { ReferenceTableRouter };