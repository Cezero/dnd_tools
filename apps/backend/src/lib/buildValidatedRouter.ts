/**
 * Validated router builder for type-safe Express routes with Zod validation.
 * 
 * This module provides a type-safe router builder that integrates Zod schema validation
 * directly into Express route handlers, ensuring type safety from route definition through
 * to handler execution.
 * 
 * Architecture Decisions:
 * - Type-safe routing: Request parameters, query strings, and body are validated and typed
 *   at compile time, eliminating runtime type errors
 * - Zod integration: Uses Zod schemas for validation, providing both runtime validation
 *   and TypeScript type inference
 * - Middleware support: Allows Express middleware to be applied before validation
 * - Flexible validation: Supports optional validation for params, query, body, and headers
 * 
 * Usage Pattern:
 * Routes use this builder to create validated route handlers that automatically:
 * 1. Validate request data against Zod schemas
 * 2. Transform validated data to typed request objects
 * 3. Pass validation errors to error middleware
 * 
 * Source File: `apps/backend/src/lib/buildValidatedRouter.ts`
 * 
 * @example
 * ```typescript
 * const { router, get, post } = buildValidatedRouter();
 * 
 * get('/users/:id', requireAuth, 
 *   { params: UserIdParamSchema },
 *   async (req, res) => {
 *     // req.params is typed and validated
 *     const userId = req.params.id; // TypeScript knows this is a string
 *   }
 * );
 * ```
 */

import {
    Router,
    Request,
    Response,
    NextFunction,
    RequestHandler,
    RouterOptions,
} from 'express';
import type { ParsedQs } from 'qs';
import { ZodType } from 'zod';

import { InferOrDefault } from './types';

type ValidatedRequest<
    P extends ZodType | undefined = undefined,
    Q extends ZodType | undefined = undefined,
    B extends ZodType | undefined = undefined,
    H extends ZodType | undefined = undefined
> = Request<
    InferOrDefault<P, Record<string, string>>,
    unknown,
    InferOrDefault<B, unknown>,
    InferOrDefault<Q, ParsedQs>
> & {
    headers: InferOrDefault<H, Record<string, string | string[] | undefined>>;
};

type ValidatedHandler<
    P extends ZodType | undefined = undefined,
    Q extends ZodType | undefined = undefined,
    B extends ZodType | undefined = undefined,
    H extends ZodType | undefined = undefined
> = (
    req: ValidatedRequest<P, Q, B, H>,
    res: Response,
    next: NextFunction
) => Promise<void> | void;

/**
 * Removes undefined keys from an object to prevent Zod validation issues.
 * 
 * Architecture Decision: Zod schemas may fail validation if undefined values are present
 * in optional fields. This utility ensures only defined values are passed to validators.
 * 
 * @param input - Object to strip undefined keys from
 * @returns Object with undefined keys removed
 */
function stripUndefinedKeys<T extends object>(input: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(input).filter(([_, v]) => v !== undefined)
    ) as Partial<T>;
}

/**
 * Creates a validated Express request handler with type-safe request data.
 * 
 * This function wraps a route handler with validation logic that:
 * 1. Validates request params, query, body, and headers against Zod schemas
 * 2. Transforms the request object with validated, typed data
 * 3. Passes validation errors to Express error middleware
 * 
 * Architecture Decision: Validation happens in middleware before the handler executes,
 * ensuring handlers only receive valid, typed data. This eliminates the need for
 * manual validation in every handler.
 * 
 * @param schemas - Zod schemas for params, query, body, and headers (all optional)
 * @param handler - The route handler function with typed request
 * @returns Express middleware function that validates and calls the handler
 * 
 * @example
 * ```typescript
 * const handler = buildValidatedHandler(
 *   { params: UserIdParamSchema, body: UpdateUserSchema },
 *   async (req, res) => {
 *     // req.params and req.body are validated and typed
 *   }
 * );
 * ```
 */
export function buildValidatedHandler<
    P extends ZodType | undefined = undefined,
    Q extends ZodType | undefined = undefined,
    B extends ZodType | undefined = undefined,
    H extends ZodType | undefined = undefined
>(
    schemas: { params?: P; query?: Q; body?: B; headers?: H },
    handler: ValidatedHandler<P, Q, B, H>
): RequestHandler {
    const wrapped: RequestHandler = async (req, res, next) => {
        try {
            const parsedReq = {
                ...req,
                params: schemas.params ? schemas.params.parse(stripUndefinedKeys(req.params)) : req.params,
                query: schemas.query
                    ? schemas.query.parse(stripUndefinedKeys(req.query))
                    : req.query,
                body: schemas.body ? schemas.body.parse(stripUndefinedKeys(req.body)) : req.body,
                headers: schemas.headers ? schemas.headers.parse(stripUndefinedKeys(req.headers)) : req.headers,
            };

            await handler(parsedReq as ValidatedRequest<P, Q, B, H>, res, next);
        } catch (err) {
            next(err);
        }
    };

    return wrapped;
}

/**
 * Creates a validated Express router with type-safe route registration methods.
 * 
 * This function returns a router and convenience methods (get, post, put, patch, delete)
 * that automatically apply validation to route handlers. The methods support:
 * - Optional middleware before validation
 * - Zod schema validation for params, query, body, and headers
 * - Type-safe request objects in handlers
 * 
 * Architecture Decision: The router builder pattern provides a clean API for route
 * registration while maintaining type safety. The register function handles the complexity
 * of extracting middleware, schemas, and handlers from the arguments.
 * 
 * Usage Pattern:
 * All routes in the application use this builder to ensure consistent validation
 * and type safety across all endpoints.
 * 
 * @param options - Optional Express RouterOptions
 * @returns Router and typed route registration methods
 * 
 * @example
 * ```typescript
 * const { router, get, post } = buildValidatedRouter();
 * 
 * get('/users/:id', requireAuth, 
 *   { params: UserIdParamSchema },
 *   GetUserById
 * );
 * 
 * post('/users', requireAuth,
 *   { body: CreateUserSchema },
 *   CreateUser
 * );
 * ```
 */
export function buildValidatedRouter(options?: RouterOptions) {
    const router = Router(options);

    function register<
        P extends ZodType | undefined = undefined,
        Q extends ZodType | undefined = undefined,
        B extends ZodType | undefined = undefined,
        H extends ZodType | undefined = undefined
    >(
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        path: string,
        ...handlers: [
            ...RequestHandler[], // middleware
            { params?: P; query?: Q; body?: B; headers?: H },
            ValidatedHandler<P, Q, B, H>
        ]
    ) {
        const schemas = handlers[handlers.length - 2] as { params?: P; query?: Q; body?: B; headers?: H };
        const routeHandler = handlers[handlers.length - 1] as ValidatedHandler<P, Q, B, H>;

        const middleware = handlers.slice(0, -2) as RequestHandler[];

        const validated = buildValidatedHandler(schemas, routeHandler);

        router[method](path, ...middleware, validated);
    }

    return {
        router,
        get: <P extends ZodType | undefined = undefined, Q extends ZodType | undefined = undefined, B extends ZodType | undefined = undefined, H extends ZodType | undefined = undefined>(
            path: string,
            ...handlers: [...RequestHandler[], { params?: P; query?: Q; body?: B; headers?: H }, ValidatedHandler<P, Q, B, H>]
        ) => register<P, Q, B, H>('get', path, ...handlers),
        post: <P extends ZodType | undefined = undefined, Q extends ZodType | undefined = undefined, B extends ZodType | undefined = undefined, H extends ZodType | undefined = undefined>(
            path: string,
            ...handlers: [...RequestHandler[], { params?: P; query?: Q; body?: B; headers?: H }, ValidatedHandler<P, Q, B, H>]
        ) => register<P, Q, B, H>('post', path, ...handlers),
        put: <P extends ZodType | undefined = undefined, Q extends ZodType | undefined = undefined, B extends ZodType | undefined = undefined, H extends ZodType | undefined = undefined>(
            path: string,
            ...handlers: [...RequestHandler[], { params?: P; query?: Q; body?: B; headers?: H }, ValidatedHandler<P, Q, B, H>]
        ) => register<P, Q, B, H>('put', path, ...handlers),
        patch: <P extends ZodType | undefined = undefined, Q extends ZodType | undefined = undefined, B extends ZodType | undefined = undefined, H extends ZodType | undefined = undefined>(
            path: string,
            ...handlers: [...RequestHandler[], { params?: P; query?: Q; body?: B; headers?: H }, ValidatedHandler<P, Q, B, H>]
        ) => register<P, Q, B, H>('patch', path, ...handlers),
        delete: <P extends ZodType | undefined = undefined, Q extends ZodType | undefined = undefined, B extends ZodType | undefined = undefined, H extends ZodType | undefined = undefined>(
            path: string,
            ...handlers: [...RequestHandler[], { params?: P; query?: Q; body?: B; headers?: H }, ValidatedHandler<P, Q, B, H>]
        ) => register<P, Q, B, H>('delete', path, ...handlers),
    };
}
