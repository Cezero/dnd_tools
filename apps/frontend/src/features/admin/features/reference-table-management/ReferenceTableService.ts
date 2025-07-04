import { z } from 'zod';

import { typedApi } from '@/services/Api';
import {
    ReferenceTableQuerySchema,
    ReferenceTableSlugParamSchema,
    CreateReferenceTableSchema,
    UpdateReferenceTableSchema,
    ReferenceTableQueryResponseSchema,
    ReferenceTableSchema,
    ReferenceTableDataResponseSchema,
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

    // Create reference table
    createReferenceTable: typedApi<typeof CreateReferenceTableSchema, typeof ReferenceTableSchema>({
        path: '/referencetables',
        method: 'POST',
        requestSchema: CreateReferenceTableSchema,
        responseSchema: ReferenceTableSchema,
    }),

    // Update reference table with path parameter
    updateReferenceTable: typedApi<typeof UpdateReferenceTableSchema, typeof ReferenceTableSchema, typeof ReferenceTableSlugParamSchema>({
        path: '/referencetables/:slug',
        method: 'PUT',
        requestSchema: UpdateReferenceTableSchema,
        paramsSchema: ReferenceTableSlugParamSchema,
        responseSchema: ReferenceTableSchema,
    }),

    // Delete reference table with path parameter
    deleteReferenceTable: typedApi<undefined, z.ZodObject<Record<string, never>>, typeof ReferenceTableSlugParamSchema>({
        path: '/referencetables/:slug',
        method: 'DELETE',
        paramsSchema: ReferenceTableSlugParamSchema,
        responseSchema: z.object({}),
    }),
};
