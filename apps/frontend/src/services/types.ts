import { ZodSchema, ZodTypeAny } from "zod";


export interface ApiOptions<TRequest = unknown, TParams = unknown> {
    body?: TRequest;
    query?: TRequest;
    params?: TParams;

    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;

    requestSchema?: ZodSchema<TRequest>;
    paramsSchema?: ZodSchema<TParams>;
    responseSchema?: ZodTypeAny;

    signal?: AbortSignal;

    skipRequestValidation?: boolean;
}