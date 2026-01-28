import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { ZodType } from 'zod';

import { typedApi } from '@/services/Api';

/**
 * Factory function that creates TanStack Query hooks and imperative methods for backend API endpoints.
 * 
 * This factory pattern ensures consistency across all API interactions and provides type safety
 * through Zod schema validation. It automatically generates useQuery hooks for GET requests and
 * useMutation hooks for POST/PUT/PATCH/DELETE requests, along with imperative methods for use
 * outside React components.
 * 
 * @template TRequestSchema - Zod schema for request body validation (optional for GET requests)
 * @template TResponseSchema - Zod schema for response validation
 * @template TParamsSchema - Zod schema for path/query parameter validation (optional)
 * 
 * @param config - Configuration object for the query hooks
 * @param config.path - API endpoint path (supports path parameters like '/items/:id')
 * @param config.method - HTTP method (defaults to 'GET')
 * @param config.requestSchema - Optional Zod schema for request body validation
 * @param config.paramsSchema - Optional Zod schema for path/query parameter validation
 * @param config.responseSchema - Zod schema for response validation
 * @param config.queryKey - Base query key for TanStack Query cache (e.g., 'items', 'feats')
 * @param config.queryKeyBuilder - Optional function to build custom query keys. If not provided,
 *   defaults to [queryKey, params]. Should return an array that uniquely identifies the cached data.
 *   For list queries without parameters, use: () => ['entity', 'list']
 * 
 * @returns Object containing:
 *   - useQuery: React hook for GET requests (automatically cached)
 *   - useMutation: React hook for POST/PUT/PATCH/DELETE requests (invalidates cache on success)
 *   - queryFn: Imperative query function for advanced usage
 *   - queryKeyBuilder: Function to generate query keys programmatically
 *   - fetch: Imperative fetch method (uses TanStack Query cache if queryClient provided)
 *   - mutate: Imperative mutation method (invalidates cache if queryClient provided)
 * 
 * @example
 * ```typescript
 * // List query without parameters
 * const itemsConfig = createQueryHooks({
 *     path: '/items',
 *     method: 'GET',
 *     responseSchema: GetAllItemsResponseSchema,
 *     queryKey: 'items',
 *     queryKeyBuilder: () => ['items', 'list'], // No parameters
 * });
 * 
 * // Item query with path parameters
 * const itemByIdConfig = createQueryHooks({
 *     path: '/items/:id',
 *     method: 'GET',
 *     paramsSchema: ItemIdParamSchema,
 *     responseSchema: ItemSchema,
 *     queryKey: 'items',
 *     queryKeyBuilder: (params) => ['items', 'item', params.pathParams.id],
 * });
 * ```
 * 
 * @see [Query Hooks and Caching Architecture](../../../../packages/shared/docs/application-overview/query-hooks-and-caching.md)
 */
export function createQueryHooks<
    TRequestSchema extends ZodType | undefined,
    TResponseSchema extends ZodType,
    TParamsSchema extends ZodType | undefined = undefined
>(config: {
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    requestSchema?: TRequestSchema;
    paramsSchema?: TParamsSchema;
    responseSchema: TResponseSchema;
    queryKey: string;
    queryKeyBuilder?: (params?: unknown) => (string | number | object)[];
}) {
    const apiFunction = typedApi(config);

    /**
     * Default query key builder that includes params in the key.
     * Used when no custom queryKeyBuilder is provided.
     */
    const defaultQueryKeyBuilder = (params?: unknown) => [config.queryKey, params];
    const queryKeyBuilder = config.queryKeyBuilder || defaultQueryKeyBuilder;

    /**
     * React hook for GET requests that automatically manages caching, refetching, and state.
     * 
     * @param params - Optional parameters for the query (path params, query params, or request data)
     * @param options - Optional TanStack Query options (staleTime, gcTime, enabled, etc.)
     * @returns TanStack Query result object with data, isLoading, error, etc.
     * 
     * @remarks
     * - Automatically caches responses using the queryKeyBuilder
     * - Supports background refetching and stale-while-revalidate patterns
     * - If requestSchema is provided, params are passed directly as requestData
     * - Otherwise, params should be { requestData?, pathParams? }
     */
    const useQueryHook = (params?: unknown, options?: unknown) => {
        return useQuery({
            queryKey: queryKeyBuilder(params),
            queryFn: () => {
                // If there's a requestSchema, pass params directly as requestData
                if (config.requestSchema) {
                    return apiFunction(params as never, undefined);
                }

                // Otherwise, pathParams are the first (and only) argument when no requestSchema
                const typedParams = params as { requestData?: unknown; pathParams?: unknown } | undefined;
                return apiFunction(typedParams?.pathParams as never);
            },
            ...(options as Record<string, unknown>), // Spread all react-query options
        });
    };

    /**
     * React hook for POST/PUT/PATCH/DELETE requests that automatically invalidates related queries.
     * 
     * @param options - Optional TanStack Query mutation options
     * @returns TanStack Query mutation object with mutate, mutateAsync, isLoading, error, etc.
     * 
     * @remarks
     * - Automatically invalidates queries matching the base queryKey on success
     * - Also invalidates individual item queries if pathParams.id exists
     * - Supports optimistic updates and error handling
     * - Data should be { requestData?, pathParams? }
     */
    const useMutationHook = (options?: unknown) => {
        const queryClient = useQueryClient();

        return useMutation({
            mutationFn: (data: { requestData?: unknown; pathParams?: unknown }) => {
                // If there's a requestSchema, call (requestData, params).
                if (config.requestSchema) {
                    return apiFunction(data.requestData as never, data.pathParams as never);
                }
                // Otherwise, params are the first (and only) argument.
                return apiFunction(data.pathParams as never);
            },
            onSuccess: (_data, variables) => {
                // Auto-invalidate related queries using the query key builder
                const baseQueryKey = config.queryKey;
                queryClient.invalidateQueries({ queryKey: [baseQueryKey] });

                // Specific invalidation for individual items if pathParams.id exists
                const pathParams = variables.pathParams as { id?: unknown } | undefined;
                if (pathParams?.id) {
                    queryClient.invalidateQueries({
                        queryKey: [baseQueryKey, { id: pathParams.id }]
                    });
                }
            },
            ...(options as Record<string, unknown>), // Spread all react-query options
        });
    };

    /**
     * Imperative query function for advanced usage outside React components.
     * 
     * @param params - Optional parameters for the query
     * @returns Promise resolving to the API response (validated by responseSchema)
     * 
     * @remarks
     * - Does not use TanStack Query cache (use fetch() for cached queries)
     * - Directly calls the API endpoint
     * - Useful for one-time fetches in event handlers or utilities
     */
    const queryFn = (params?: unknown) => {
        if (config.requestSchema) {
            return apiFunction(params as never, undefined);
        }
        const typedParams = params as { requestData?: unknown; pathParams?: unknown } | undefined;
        return apiFunction(typedParams?.pathParams as never);
    };

    /**
     * Imperative fetch method that uses TanStack Query cache if queryClient is provided.
     * 
     * @param params - Optional parameters for the query
     * @param options - Optional cache options (staleTime, gcTime)
     * @param queryClient - Optional TanStack Query client for cache management
     * @returns Promise resolving to the API response (from cache if available, otherwise from API)
     * 
     * @remarks
     * - If queryClient is provided, uses TanStack Query's fetchQuery which checks cache first
     * - If queryClient is not provided, directly calls the API (no caching)
     * - Default staleTime: 5 minutes, default gcTime: 10 minutes
     * - Useful for imperative data fetching in event handlers or async functions
     */
    const fetch = async (params?: unknown, options?: { staleTime?: number; gcTime?: number }, queryClient?: QueryClient) => {
        if (!queryClient) {
            // If no queryClient provided, just call the API directly
            return queryFn(params);
        }
        return queryClient.fetchQuery({
            queryKey: queryKeyBuilder(params),
            queryFn: () => queryFn(params),
            staleTime: options?.staleTime || 5 * 60 * 1000,
            gcTime: options?.gcTime || 10 * 60 * 1000,
        });
    };

    /**
     * Imperative mutation method that invalidates related queries if queryClient is provided.
     * 
     * @param data - Mutation data with optional requestData and pathParams
     * @param queryClient - Optional TanStack Query client for cache invalidation
     * @returns Promise resolving to the API response
     * 
     * @remarks
     * - If queryClient is provided, automatically invalidates queries matching the base queryKey
     * - Also invalidates individual item queries if pathParams.id exists
     * - Useful for imperative mutations in event handlers or async functions
     */
    const mutate = async (data: { requestData?: unknown; pathParams?: unknown }, queryClient?: QueryClient) => {
        const result = config.requestSchema
            ? await apiFunction(data.requestData as never, data.pathParams as never)
            : await apiFunction(data.pathParams as never);

        // Auto-invalidate related queries using the query key builder if queryClient is provided
        if (queryClient) {
            const baseQueryKey = config.queryKey;
            queryClient.invalidateQueries({ queryKey: [baseQueryKey] });

            // Specific invalidation for individual items if pathParams.id exists
            const pathParams = data.pathParams as { id?: unknown } | undefined;
            if (pathParams?.id) {
                queryClient.invalidateQueries({
                    queryKey: [baseQueryKey, { id: pathParams.id }]
                });
            }
        }

        return result;
    };

    return {
        useQuery: useQueryHook,
        useMutation: useMutationHook,
        queryFn,
        queryKeyBuilder,
        fetch,
        mutate,
    };
}
