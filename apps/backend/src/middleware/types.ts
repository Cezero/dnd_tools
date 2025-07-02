import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export type ValidatedHandler<
    Params extends z.ZodTypeAny = z.ZodUndefined,
    Query extends z.ZodTypeAny = z.ZodUndefined,
    Body extends z.ZodTypeAny = z.ZodUndefined,
    ResBody = unknown
> = (
    req: Request<z.infer<Params>, ResBody, z.infer<Body>, z.infer<Query>>,
    res: Response<ResBody>,
    next: NextFunction
) => Promise<void>

export type Schemas = {
    body?: ZodSchema;
    params?: ZodSchema;
    query?: ZodSchema;
    headers?: ZodSchema;
};

export interface AuthOptions {
    requireAuth?: boolean;
    requireAdmin?: boolean;
}