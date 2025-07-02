import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    ReferenceTableQuerySchema,
    ReferenceTableIdentifierSchema,
    UpdateReferenceTableSchema
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

get('/:identifier', { params: ReferenceTableIdentifierSchema }, GetReferenceTable);

post('/', requireAdmin, { body: UpdateReferenceTableSchema }, CreateReferenceTable);

put('/:identifier', requireAdmin, { params: ReferenceTableIdentifierSchema, body: UpdateReferenceTableSchema }, UpdateReferenceTable);

deleteRoute('/:identifier', requireAdmin, { params: ReferenceTableIdentifierSchema }, DeleteReferenceTable); 

export { ReferenceTableRouter };