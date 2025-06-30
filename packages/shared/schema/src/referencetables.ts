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

// Schema for table header
export const TableHeaderSchema = z.object({
    header: z.string()
        .min(1, 'Header is required')
        .max(100, 'Header must be less than 100 characters')
        .trim(),
    alignment: z.enum(['left', 'center', 'right']).optional().default('left'),
});

// Schema for table cell
export const TableCellSchema = z.object({
    column_index: z.number().int().min(0, 'Column index must be non-negative'),
    value: z.string().max(1000, 'Cell value must be less than 1000 characters').optional(),
    col_span: z.number().int().min(1, 'Column span must be at least 1').max(10, 'Column span must be at most 10').optional(),
    row_span: z.number().int().min(1, 'Row span must be at least 1').max(10, 'Row span must be at most 10').optional(),
});

// Schema for table row
export const TableRowSchema = z.array(TableCellSchema);

// Schema for creating a reference table
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
    headers: z.array(TableHeaderSchema)
        .min(1, 'At least one header is required')
        .max(20, 'Maximum 20 headers allowed'),
    rows: z.array(TableRowSchema)
        .min(0, 'Rows cannot be negative')
        .max(1000, 'Maximum 1000 rows allowed'),
});

// Schema for updating a reference table (same as create but all fields optional)
export const UpdateReferenceTableSchema = CreateReferenceTableSchema.partial().extend({
    name: z.string()
        .min(1, 'Table name is required')
        .max(200, 'Table name must be less than 200 characters')
        .trim(),
    slug: z.string()
        .min(1, 'Table slug is required')
        .max(100, 'Table slug must be less than 100 characters')
        .regex(/^[a-z0-9-]+$/, 'Table slug can only contain lowercase letters, numbers, and hyphens')
        .trim(),
    headers: z.array(TableHeaderSchema)
        .min(1, 'At least one header is required')
        .max(20, 'Maximum 20 headers allowed'),
});

// Type inference from schemas
export type ReferenceTableQueryRequest = z.infer<typeof ReferenceTableQuerySchema>;
export type ReferenceTableIdentifierParamRequest = z.infer<typeof ReferenceTableIdentifierParamSchema>;
export type CreateReferenceTableRequest = z.infer<typeof CreateReferenceTableSchema>;
export type UpdateReferenceTableRequest = z.infer<typeof UpdateReferenceTableSchema>; 