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

function stripUndefinedKeys<T extends object>(input: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(input).filter(([_, v]) => v !== undefined)
    ) as Partial<T>;
}

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
