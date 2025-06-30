import { z } from 'zod';

// Schema for reference table query parameters
export const ReferenceTableQuerySchema = z.object({
    page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 25),
    sort: z.enum(['name', 'slug']).optional().default('name'),
    order: z.enum(['asc', 'desc']).optional().default('asc'),
    name: z.string().optional(),
    slug: z.string().optional(),
});

// Schema for reference table path parameters (can be ID or slug)
export const ReferenceTableIdentifierParamSchema = z.object({
    identifier: z.string().transform((val: string) => {
        const num = parseInt(val);
        return isNaN(num) ? val : num;
    }),
});

// Schema for table column (matches Prisma ReferenceTableColumn)
export const TableColumnSchema = z.object({
    columnIndex: z.number().int().min(0, 'Column index must be non-negative'),
    header: z.string()
        .min(1, 'Header is required')
        .max(100, 'Header must be less than 100 characters')
        .trim(),
    span: z.number().int().min(1, 'Span must be at least 1').max(10, 'Span must be at most 10').optional(),
    alignment: z.enum(['left', 'center', 'right']).optional().default('left'),
});

// Schema for table cell (matches Prisma ReferenceTableCell)
export const TableCellSchema = z.object({
    value: z.string().max(1000, 'Cell value must be less than 1000 characters').optional(),
    colSpan: z.number().int().min(1, 'Column span must be at least 1').max(10, 'Column span must be at most 10').optional(),
    rowSpan: z.number().int().min(1, 'Row span must be at least 1').max(10, 'Row span must be at most 10').optional(),
    columnIndex: z.number().int().min(0, 'Column index must be non-negative'),
});

// Schema for table row (matches Prisma ReferenceTableRow)
export const TableRowSchema = z.object({
    rowIndex: z.number().int().min(0, 'Row index must be non-negative'),
    label: z.string().max(200, 'Label must be less than 200 characters').optional(),
    cells: z.array(TableCellSchema).optional(),
});

// Schema for creating a reference table (matches Prisma ReferenceTableCreateInput)
export const CreateReferenceTableSchema = z.object({
    name: z.string()
        .min(1, 'Table name is required')
        .max(200, 'Table name must be less than 200 characters')
        .trim(),
    description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
    slug: z.string()
        .min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
    columns: z.object({
        create: z.array(TableColumnSchema)
            .min(1, 'At least one column is required')
            .max(20, 'Maximum 20 columns allowed'),
    }),
    rows: z.object({
        create: z.array(TableRowSchema)
            .min(0, 'Rows cannot be negative')
            .max(1000, 'Maximum 1000 rows allowed'),
    }),
});

// Schema for updating a reference table (matches Prisma ReferenceTableUpdateInput)
export const UpdateReferenceTableSchema = z.object({
    name: z.string()
        .min(1, 'Table name is required')
        .max(200, 'Table name must be less than 200 characters')
        .trim(),
    slug: z.string()
        .min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
    description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
    columns: z.object({
        deleteMany: z.object({}),
        create: z.array(TableColumnSchema)
            .min(1, 'At least one column is required')
            .max(20, 'Maximum 20 columns allowed'),
    }),
    rows: z.object({
        deleteMany: z.object({}),
        create: z.array(TableRowSchema)
            .min(0, 'Rows cannot be negative')
            .max(1000, 'Maximum 1000 rows allowed'),
    }),
});

// Type inference from schemas
export type ReferenceTableQueryRequest = z.infer<typeof ReferenceTableQuerySchema>;
export type ReferenceTableIdentifierParamRequest = z.infer<typeof ReferenceTableIdentifierParamSchema>;
export type CreateReferenceTableRequest = z.infer<typeof CreateReferenceTableSchema>;
export type UpdateReferenceTableRequest = z.infer<typeof UpdateReferenceTableSchema>; 