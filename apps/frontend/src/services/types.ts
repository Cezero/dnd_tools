import { z } from "zod";


export interface ApiOptions<TRequest = unknown, TParams = unknown> {
    body?: TRequest;
    query?: TRequest;
    params?: TParams;

    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;

    requestSchema?: z.ZodType;
    paramsSchema?: z.ZodType;
    responseSchema?: z.ZodType;

    signal?: AbortSignal;

    skipRequestValidation?: boolean;
}
