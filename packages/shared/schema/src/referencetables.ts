import { z } from 'zod';
import { QueryResponseSchema } from './query.js';
import { commonValidations } from './common.js';

// Enum schemas
export const TextAlignmentEnumSchema = z.enum(['left', 'center', 'right']);

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
    index: commonValidations.nonNegativeInt('Column index'),
    header: z.string()
        .min(1, 'Header is required')
        .max(100, 'Header must be less than 100 characters')
        .trim(),
    span: z.number().int().min(1, 'Span must be at least 1').max(10, 'Span must be at most 10').optional().nullable(),
    alignment: TextAlignmentEnumSchema.nullable().default('left'),
});

// Schema for table cell (matches Prisma ReferenceTableCell)
export const TableCellSchema = z.object({
    tableSlug: z.string().min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
    rowIndex: commonValidations.nonNegativeInt('Row index'),
    columnIndex: commonValidations.nonNegativeInt('Column index'),
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
    index: commonValidations.nonNegativeInt('Row index'),
    cells: z.array(TableCellSchema).nullable(),
});

export const ReferenceTableDataResponseSchema = ReferenceTableSchema.extend({
    columns: z.array(TableColumnSchema).nullable(),
    rows: z.array(TableRowSchema).nullable(),
});

export const ReferenceTableSummarySchema = ReferenceTableSchema.extend({
    rows: commonValidations.nonNegativeInt('Rows'),
    columns: commonValidations.nonNegativeInt('Columns'),
});

export const GetAllReferenceTablesResponseSchema = QueryResponseSchema.extend({
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

export type ReferenceTableSlugParamRequest = z.infer<typeof ReferenceTableSlugParamSchema>;
export type ReferenceTableDataResponse = z.infer<typeof ReferenceTableDataResponseSchema>;
export type GetAllReferenceTablesResponse = z.infer<typeof GetAllReferenceTablesResponseSchema>;
export type ReferenceTableSummary = z.infer<typeof ReferenceTableSummarySchema>;
export type ReferenceTable = z.infer<typeof ReferenceTableSchema>;
export type ReferenceTableUpdate = z.infer<typeof ReferenceTableUpdateSchema>;

// Enum type exports
export type TextAlignment = z.infer<typeof TextAlignmentEnumSchema>;

export type ReferenceTableColumn = z.infer<typeof TableColumnSchema>;
export type ReferenceTableRow = z.infer<typeof TableRowSchema>;
export type ReferenceTableCell = z.infer<typeof TableCellSchema>;
