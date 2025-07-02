import { z } from 'zod';
import { PageQueryResponseSchema, PageQuerySchema } from './query.js';

// Schema for reference table query parameters
export const ReferenceTableQuerySchema = PageQuerySchema.extend({
    sort: z.enum(['name', 'slug']).optional().default('name'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
    name: z.string().optional(),
    slug: z.string().optional(),
});

// Schema for reference table identifier (slug)
export const ReferenceTableIdentifierSchema = z.object({
    identifier: z.string().min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
});

export const ReferenceTableSchema = z.object({
    name: z.string().min(1, 'Table name is required')
        .max(200, 'Table name must be less than 200 characters')
        .trim(),
    description: z.string().max(2000, 'Description must be less than 2000 characters').nullable(),
    slug: z.string().min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
});

// Schema for table column (matches Prisma ReferenceTableColumn)
export const TableColumnSchema = z.object({
    tableSlug: z.string().min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
    id: z.number().int().min(0, 'Column id must be non-negative').optional(),
    columnIndex: z.number().int().min(0, 'Column index must be non-negative'),
    header: z.string()
        .min(1, 'Header is required')
        .max(100, 'Header must be less than 100 characters')
        .trim(),
    span: z.number().int().min(1, 'Span must be at least 1').max(10, 'Span must be at most 10').nullable(),
    alignment: z.enum(['left', 'center', 'right']).nullable().default('left'),
});

// Schema for table cell (matches Prisma ReferenceTableCell)
export const TableCellSchema = z.object({
    tableSlug: z.string().min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
    rowId: z.number().int().min(0, 'Row id must be non-negative'),
    columnId: z.number().int().min(0, 'Column id must be non-negative'),
    id: z.number().int().min(0, 'Cell id must be non-negative').optional(),
    value: z.string().max(10000, 'Cell value must be less than 10000 characters').nullable(),
    colSpan: z.number().int().min(1, 'Column span must be at least 1').max(10, 'Column span must be at most 10').nullable(),
    rowSpan: z.number().int().min(1, 'Row span must be at least 1').max(10, 'Row span must be at most 10').nullable()
});

// Schema for table row (matches Prisma ReferenceTableRow)
export const TableRowSchema = z.object({
    tableSlug: z.string().min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
    id: z.number().int().min(0, 'Row id must be non-negative').optional(),
    rowIndex: z.number().int().min(0, 'Row index must be non-negative'),
    label: z.string().max(200, 'Label must be less than 200 characters').nullable(),
});

// Schema for creating a reference table (matches Prisma ReferenceTableCreateInput)
export const CreateReferenceTableSchema = ReferenceTableSchema.extend({
    columns: z.array(TableColumnSchema)
            .min(1, 'At least one column is required')
            .max(20, 'Maximum 20 columns allowed'),
    rows: z.array(TableRowSchema)
            .min(0, 'Rows cannot be negative')
            .max(1000, 'Maximum 1000 rows allowed'),
    cells: z.array(TableCellSchema)
            .min(0, 'Cells cannot be negative')
            .max(1000, 'Maximum 1000 cells allowed'),
});

export const UpdateReferenceTableSchema = CreateReferenceTableSchema.partial();

export const ReferenceTableDataResponseSchema = ReferenceTableSchema.extend({
    columns: z.array(TableColumnSchema).nullable(),
    rows: z.array(TableRowSchema.extend({
        cells: z.array(TableCellSchema).nullable(),
    }).nullable()),
});

export const ReferenceTableQueryResponseSchema = PageQueryResponseSchema.extend({
    results: z.array(ReferenceTableSchema.extend({
        _count: z.object({
            rows: z.number().int().min(0, 'Rows must be non-negative'),
            columns: z.number().int().min(0, 'Columns must be non-negative'),
        })
    })),
});

// Type inference from schemas
export type ReferenceTableQueryRequest = z.infer<typeof ReferenceTableQuerySchema>;
export type ReferenceTableIdentifierRequest = z.infer<typeof ReferenceTableIdentifierSchema>;
export type CreateReferenceTableRequest = z.infer<typeof CreateReferenceTableSchema>;
export type UpdateReferenceTableRequest = z.infer<typeof UpdateReferenceTableSchema>;
export type ReferenceTableDataResponse = z.infer<typeof ReferenceTableDataResponseSchema>;
export type ReferenceTableQueryResponse = z.infer<typeof ReferenceTableQueryResponseSchema>;
