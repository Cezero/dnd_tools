import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    ReferenceTableSlugParamSchema,
    ReferenceTableUpdateSchema
} from '@shared/schema';

import {
    GetAllReferenceTables,
    GetReferenceTable,
    CreateReferenceTable,
    UpdateReferenceTable,
    DeleteReferenceTable,
    GetReferenceTableSummary,
} from './referenceTableController.js';

const { router: ReferenceTableRouter, get, post, put, delete: deleteRoute } = buildValidatedRouter();

get('/', {}, GetAllReferenceTables);

get('/:slug', { params: ReferenceTableSlugParamSchema }, GetReferenceTable);

get('/:slug/summary', { params: ReferenceTableSlugParamSchema }, GetReferenceTableSummary);

post('/', requireAdmin, { body: ReferenceTableUpdateSchema }, CreateReferenceTable);

put('/:slug', requireAdmin, { params: ReferenceTableSlugParamSchema, body: ReferenceTableUpdateSchema }, UpdateReferenceTable);

deleteRoute('/:slug', requireAdmin, { params: ReferenceTableSlugParamSchema }, DeleteReferenceTable);

export { ReferenceTableRouter };
