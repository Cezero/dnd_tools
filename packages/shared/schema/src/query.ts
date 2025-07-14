import { z } from 'zod';

export const PageQuerySchema = z.object({
    page: z.number().int().min(1, 'Page must be at least 1').optional(),
    limit: z.number().int().min(1, 'Limit must be at least 1').optional(),
});

export const PageQueryResponseSchema = z.object({
    page: z.number().int().min(1, 'Page must be at least 1'),
    limit: z.number().int().min(1, 'Limit must be at least 1'),
    total: z.number().int().min(0, 'Total must be non-negative'),
});

