import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
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

// Reference Table Read Routes (public)
// GET /api/referencetables - Get all reference tables with metadata (row/column counts)
get('/', {}, GetAllReferenceTables);
// GET /api/referencetables/:slug - Get complete reference table data by slug (used by markdown rendering)
get('/:slug', { params: ReferenceTableSlugParamSchema }, GetReferenceTable);
// GET /api/referencetables/:slug/summary - Get reference table summary with metadata
get('/:slug/summary', { params: ReferenceTableSlugParamSchema }, GetReferenceTableSummary);

// Reference Table Write Routes (admin only)
// POST /api/referencetables - Create reference table with columns, rows, and cells
post('/', requireAdmin, { body: ReferenceTableUpdateSchema }, CreateReferenceTable);
// PUT /api/referencetables/:slug - Update reference table using delete/recreate pattern
put('/:slug', requireAdmin, { params: ReferenceTableSlugParamSchema, body: ReferenceTableUpdateSchema }, UpdateReferenceTable);
// DELETE /api/referencetables/:slug - Delete reference table and all nested data
deleteRoute('/:slug', requireAdmin, { params: ReferenceTableSlugParamSchema }, DeleteReferenceTable);

export { ReferenceTableRouter };
