import { z } from 'zod';

export const PageQuerySchema = z.object({
    page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 10),
});

export const PageQueryResponseSchema = z.object({
    page: z.number().int().min(1, 'Page must be at least 1'),
    limit: z.number().int().min(1, 'Limit must be at least 1'),
    total: z.number().int().min(0, 'Total must be non-negative'),
});
