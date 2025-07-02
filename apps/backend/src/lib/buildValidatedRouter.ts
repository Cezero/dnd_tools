import {
    Router,
    Request,
    Response,
    NextFunction,
    RequestHandler,
    RouterOptions,
} from 'express';
import type { ParsedQs } from 'qs';
import { ZodSchema } from 'zod';

import { InferOrDefault } from './types';

type Schemas = {
    params?: ZodSchema;
    query?: ZodSchema;
    body?: ZodSchema;
    headers?: ZodSchema;
};

export function buildValidatedHandler<
    P extends ZodSchema | undefined = undefined,
    Q extends ZodSchema | undefined = undefined,
    B extends ZodSchema | undefined = undefined,
    ResBody = unknown
>(
    schemas: Schemas,
    handler: (
        req: Request<
            InferOrDefault<P, Record<string, string>>,
            ResBody,
            InferOrDefault<B, unknown>,
            InferOrDefault<Q, ParsedQs>
        >,
        res: Response<ResBody>,
        next: NextFunction
    ) => Promise<void>
): RequestHandler {
    const wrapped: RequestHandler = async (req, res, next) => {
        try {
            if (schemas.params) req.params = schemas.params.parse(req.params);
            if (schemas.query) req.query = schemas.query.parse(req.query);
            if (schemas.body) req.body = schemas.body.parse(req.body);
            if (schemas.headers) req.headers = schemas.headers.parse(req.headers);

            await handler(req as unknown as Request<
                InferOrDefault<P, Record<string, string>>,
                ResBody,
                InferOrDefault<B, unknown>,
                InferOrDefault<Q, ParsedQs>
            >, res, next);
        } catch (err) {
            next(err);
        }
    };

    return wrapped;
}

export function buildValidatedRouter(options?: RouterOptions) {
    const router = Router(options);

    function register<
        P extends ZodSchema | undefined = undefined,
        Q extends ZodSchema | undefined = undefined,
        B extends ZodSchema | undefined = undefined,
        ResBody = unknown
    >(
        method: 'get' | 'post' | 'put' | 'patch' | 'delete',
        path: string,
        ...handlers: [
            ...RequestHandler[], // middleware
            Schemas,
            (
                req: Request<
                    InferOrDefault<P, Record<string, string>>,
                    ResBody,
                    InferOrDefault<B, unknown>,
                    InferOrDefault<Q, ParsedQs>
                >,
                res: Response<ResBody>,
                next: NextFunction
            ) => Promise<void>
        ]
    ) {
        const schemas = handlers[handlers.length - 2] as Schemas;
        const routeHandler = handlers[handlers.length - 1] as (
            req: Request,
            res: Response,
            next: NextFunction
        ) => Promise<void>;

        const middleware = handlers.slice(0, -2) as RequestHandler[];

        const validated = buildValidatedHandler<P, Q, B, ResBody>(
            schemas,
            routeHandler
        );

        router[method](path, ...middleware, validated);
    }

    return {
        router,
        get: register.bind(null, 'get'),
        post: register.bind(null, 'post'),
        put: register.bind(null, 'put'),
        patch: register.bind(null, 'patch'),
        delete: register.bind(null, 'delete'),
    };
}
