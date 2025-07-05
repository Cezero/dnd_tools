import { typedApi } from '@/services/Api';
import {
    ReferenceTableQuerySchema,
    ReferenceTableSlugParamSchema,
    ReferenceTableQueryResponseSchema,
    ReferenceTableDataResponseSchema,
    ReferenceTableUpdateSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    ReferenceTableSummarySchema,
} from '@shared/schema';

/**
 * ReferenceTableService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get reference tables with query parameters
 * const tables = await ReferenceTableService.getReferenceTables({ page: 1, limit: 10 });
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
    // Get reference tables with query parameters
    getReferenceTables: typedApi<typeof ReferenceTableQuerySchema, typeof ReferenceTableQueryResponseSchema>({
        path: '/referencetables',
        method: 'GET',
        requestSchema: ReferenceTableQuerySchema,
        responseSchema: ReferenceTableQueryResponseSchema,
    }),

    // Get reference table by identifier with path parameter
    getReferenceTableByIdentifier: typedApi<undefined, typeof ReferenceTableDataResponseSchema, typeof ReferenceTableSlugParamSchema>({
        path: '/referencetables/:slug',
        method: 'GET',
        paramsSchema: ReferenceTableSlugParamSchema,
        responseSchema: ReferenceTableDataResponseSchema,
    }),

    // get reference table summary by slug
    getReferenceTableSummaryBySlug: typedApi<undefined, typeof ReferenceTableSummarySchema, typeof ReferenceTableSlugParamSchema>({
        path: '/referencetables/:slug/summary',
        method: 'GET',
        paramsSchema: ReferenceTableSlugParamSchema,
        responseSchema: ReferenceTableSummarySchema,
    }),

    // Create reference table
    createReferenceTable: typedApi<typeof ReferenceTableUpdateSchema, typeof CreateResponseSchema>({
        path: '/referencetables',
        method: 'POST',
        requestSchema: ReferenceTableUpdateSchema,
        responseSchema: CreateResponseSchema,
    }),

    // Update reference table with path parameter
    updateReferenceTable: typedApi<typeof ReferenceTableUpdateSchema, typeof UpdateResponseSchema, typeof ReferenceTableSlugParamSchema>({
        path: '/referencetables/:slug',
        method: 'PUT',
        requestSchema: ReferenceTableUpdateSchema,
        paramsSchema: ReferenceTableSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Delete reference table with path parameter
    deleteReferenceTable: typedApi<undefined, typeof UpdateResponseSchema, typeof ReferenceTableSlugParamSchema>({
        path: '/referencetables/:slug',
        method: 'DELETE',
        paramsSchema: ReferenceTableSlugParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};
