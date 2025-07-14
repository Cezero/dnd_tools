import { typedApi } from '@/services/Api';
import {
    ReferenceTableSlugParamSchema,
    ReferenceTableDataResponseSchema,
    ReferenceTableUpdateSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    ReferenceTableSummarySchema,
    GetAllReferenceTablesResponseSchema,
} from '@shared/schema';

/**
 * ReferenceTableService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get reference table by identifier (path parameter)
 * const table = await ReferenceTableService.getReferenceTableByIdentifier(undefined, { identifier: "example-table" });
 * 
 * // Create reference table
 * const newTable = await ReferenceTableService.createReferenceTable({ name: "Example Table", slug: "example-table" });
 * 
 * // Update reference table (path parameter + body)
 * const updatedTable = await ReferenceTableService.updateReferenceTable(
 *   { name: "Updated Example Table" }, 
 *   { identifier: "example-table" }
 * );
 * 
 * // Delete reference table (path parameter)
 * await ReferenceTableService.deleteReferenceTable(undefined, { identifier: "example-table" });
 */
export const ReferenceTableService = {
    getReferenceTables: typedApi({
        path: '/referencetables',
        method: 'GET',
        responseSchema: GetAllReferenceTablesResponseSchema,
    }),

    getReferenceTableByIdentifier: typedApi<undefined, typeof ReferenceTableDataResponseSchema, typeof ReferenceTableSlugParamSchema>({
        path: '/referencetables/:slug',
        method: 'GET',
        paramsSchema: ReferenceTableSlugParamSchema,
        responseSchema: ReferenceTableDataResponseSchema,
    }),

    getReferenceTableSummaryBySlug: typedApi<undefined, typeof ReferenceTableSummarySchema, typeof ReferenceTableSlugParamSchema>({
        path: '/referencetables/:slug/summary',
        method: 'GET',
        paramsSchema: ReferenceTableSlugParamSchema,
        responseSchema: ReferenceTableSummarySchema,
    }),

    createReferenceTable: typedApi<typeof ReferenceTableUpdateSchema, typeof CreateResponseSchema>({
        path: '/referencetables',
        method: 'POST',
        requestSchema: ReferenceTableUpdateSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateReferenceTable: typedApi<typeof ReferenceTableUpdateSchema, typeof UpdateResponseSchema, typeof ReferenceTableSlugParamSchema>({
        path: '/referencetables/:slug',
        method: 'PUT',
        requestSchema: ReferenceTableUpdateSchema,
        paramsSchema: ReferenceTableSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteReferenceTable: typedApi<undefined, typeof UpdateResponseSchema, typeof ReferenceTableSlugParamSchema>({
        path: '/referencetables/:slug',
        method: 'DELETE',
        paramsSchema: ReferenceTableSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};
