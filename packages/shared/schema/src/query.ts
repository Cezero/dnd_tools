import { z } from 'zod';

/**
 * Base schema for paginated query responses.
 * 
 * The total field represents the total count of items matching the query,
 * which can be any non-negative integer (no maximum limit).
 * 
 * This schema is extended by other response schemas that include a results array.
 * 
 * @example
 * ```typescript
 * export const MyListResponseSchema = QueryResponseSchema.extend({
 *   results: z.array(MyItemSchema),
 * });
 * ```
 */
export const QueryResponseSchema = z.object({
    total: z.number().int().min(0, 'Total must be non-negative'),
});

