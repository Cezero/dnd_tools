import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ZodType } from 'zod';

import { typedApi } from '@/services/Api';

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

    // Default query key builder
    const defaultQueryKeyBuilder = (params?: unknown) => [config.queryKey, params];
    const queryKeyBuilder = config.queryKeyBuilder || defaultQueryKeyBuilder;

    // Query hook for GET requests
    const useQueryHook = (params?: unknown, options?: unknown) => {
        return useQuery({
            queryKey: queryKeyBuilder(params),
            queryFn: () => {
                // If there's a requestSchema, pass params directly as requestData
                if (config.requestSchema) {
                    return apiFunction(params as never, undefined);
                }

                // Otherwise, use the requestData wrapper pattern
                const typedParams = params as { requestData?: unknown; pathParams?: unknown } | undefined;
                return apiFunction(typedParams?.requestData as never, typedParams?.pathParams as never);
            },
            ...(options as Record<string, unknown>), // Spread all react-query options
        });
    };

    // Mutation hook for POST/PUT/PATCH/DELETE
    const useMutationHook = (options?: unknown) => {
        const queryClient = useQueryClient();

        return useMutation({
            mutationFn: (data: { requestData?: unknown; pathParams?: unknown }) => {
                return apiFunction(data.requestData as never, data.pathParams as never);
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

    // Query function for imperative usage
    const queryFn = (params?: unknown) => {
        if (config.requestSchema) {
            return apiFunction(params as never, undefined);
        }
        const typedParams = params as { requestData?: unknown; pathParams?: unknown } | undefined;
        return apiFunction(typedParams?.requestData as never, typedParams?.pathParams as never);
    };

    // Imperative fetch method
    const fetch = async (params?: unknown, options?: { staleTime?: number; cacheTime?: number }, queryClient?: any) => {
        if (!queryClient) {
            // If no queryClient provided, just call the API directly
            return queryFn(params);
        }
        return queryClient.fetchQuery({
            queryKey: queryKeyBuilder(params),
            queryFn: () => queryFn(params),
            staleTime: options?.staleTime || 5 * 60 * 1000,
            cacheTime: options?.cacheTime || 10 * 60 * 1000,
        });
    };

    // Imperative mutate method
    const mutate = async (data: { requestData?: unknown; pathParams?: unknown }, queryClient?: any) => {
        const result = await apiFunction(data.requestData as never, data.pathParams as never);

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
