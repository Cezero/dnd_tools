import { ZodSchema } from "zod";

export interface ApiOptions<TRequest = unknown> {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    headers?: Record<string, string>;
    query?: TRequest;
    body?: TRequest;
    requestSchema?: ZodSchema<TRequest>;
    responseSchema?: ZodSchema<any>;
    signal?: AbortSignal;
}