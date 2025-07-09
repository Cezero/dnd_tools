import { z } from 'zod';
import { PageQueryResponseSchema, PageQuerySchema } from './query.js';
import { optionalStringParam } from './utils.js';

// Schema for reference table query parameters
export const ReferenceTableQuerySchema = PageQuerySchema.extend({
    sort: z.enum(['name', 'slug']).optional().default('name'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
    name: optionalStringParam(),
    slug: optionalStringParam(),
});

// Schema for reference table slug - path parameter
export const ReferenceTableSlugParamSchema = z.object({
    slug: z.string().min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
});

export const ReferenceTableSchema = z.object({
    slug: z.string().min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
    name: z.string().min(1, 'Table name is required')
        .max(200, 'Table name must be less than 200 characters')
        .trim(),
    description: z.string().max(2000, 'Description must be less than 2000 characters').nullable(),
});

// Schema for table column (matches Prisma ReferenceTableColumn)
export const TableColumnSchema = z.object({
    tableSlug: z.string().min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
    index: z.number().int().min(0, 'Column index must be non-negative'),
    header: z.string()
        .min(1, 'Header is required')
        .max(100, 'Header must be less than 100 characters')
        .trim(),
    span: z.number().int().min(1, 'Span must be at least 1').max(10, 'Span must be at most 10').optional().nullable(),
    alignment: z.enum(['left', 'center', 'right']).nullable().default('left'),
});

// Schema for table cell (matches Prisma ReferenceTableCell)
export const TableCellSchema = z.object({
    tableSlug: z.string().min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
    rowIndex: z.number().int().min(0, 'Row index must be non-negative'),
    columnIndex: z.number().int().min(0, 'Column index must be non-negative'),
    value: z.string().max(10000, 'Cell value must be less than 10000 characters').nullable(),
    colSpan: z.number().int().min(1, 'Column span must be at least 1').max(10, 'Column span must be at most 10').optional().nullable(),
    rowSpan: z.number().int().min(1, 'Row span must be at least 1').max(10, 'Row span must be at most 10').optional().nullable()
});

// Schema for table row (matches Prisma ReferenceTableRow)
export const TableRowSchema = z.object({
    tableSlug: z.string().min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
    index: z.number().int().min(0, 'Row index must be non-negative'),
    cells: z.array(TableCellSchema).nullable(),
});

export const ReferenceTableDataResponseSchema = ReferenceTableSchema.extend({
    columns: z.array(TableColumnSchema).nullable(),
    rows: z.array(TableRowSchema).nullable(),
});

export const ReferenceTableSummarySchema = ReferenceTableSchema.extend({
    rows: z.number().int().min(0, 'Rows must be non-negative'),
    columns: z.number().int().min(0, 'Columns must be non-negative'),
});

export const ReferenceTableQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(ReferenceTableSummarySchema),
});

// this is also used for creating a new table
export const ReferenceTableUpdateSchema = ReferenceTableSchema.extend({
    columns: z.array(TableColumnSchema.omit({ tableSlug: true })).nullable(),
    rows: z.array(
        TableRowSchema.omit({ tableSlug: true }).extend({
            cells: z.array(TableCellSchema.omit({ tableSlug: true, rowIndex: true })).nullable(),
        })
    ).nullable(),
});

// Type inference from schemas
export type ReferenceTableQueryRequest = z.infer<typeof ReferenceTableQuerySchema>;
export type ReferenceTableSlugParamRequest = z.infer<typeof ReferenceTableSlugParamSchema>;
export type ReferenceTableDataResponse = z.infer<typeof ReferenceTableDataResponseSchema>;
export type ReferenceTableQueryResponse = z.infer<typeof ReferenceTableQueryResponseSchema>;
export type ReferenceTableSummary = z.infer<typeof ReferenceTableSummarySchema>;
export type ReferenceTable = z.infer<typeof ReferenceTableSchema>;
export type ReferenceTableUpdate = z.infer<typeof ReferenceTableUpdateSchema>;

export type ReferenceTableColumn = z.infer<typeof TableColumnSchema>;
export type ReferenceTableRow = z.infer<typeof TableRowSchema>;
export type ReferenceTableCell = z.infer<typeof TableCellSchema>;
