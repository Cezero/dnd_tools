import { z } from 'zod';

export const QueryResponseSchema = z.object({
    total: z.number().int().min(0, 'Total must be non-negative'),
});

