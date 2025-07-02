import { Request } from 'express';
import type { ParsedQs } from 'qs';
import { ZodSchema, z } from 'zod';

// Shortcut to extract types from Zod schemas
type Infer<T extends ZodSchema> = z.infer<T>;

// === Body Only ===
export type ValidatedBody<
    B extends ZodSchema,
    ResBody = unknown
> = Request<Record<string, string>, ResBody, Infer<B>, ParsedQs>;

export type ValidatedBodyT<
    B,
    ResBody = unknown
> = Request<Record<string, string>, ResBody, B, ParsedQs>;

// === Query Only ===
export type ValidatedQuery<
    Q extends ZodSchema,
    ResBody = unknown
> = Request<Record<string, string>, ResBody, unknown, Infer<Q>>;

export type ValidatedQueryT<
    Q,
    ResBody = unknown
> = Request<Record<string, string>, ResBody, unknown, Q>;

// === Params Only ===
export type ValidatedParams<
    P extends ZodSchema,
    ResBody = unknown
> = Request<Infer<P>, ResBody, unknown, ParsedQs>;

export type ValidatedParamsT<
    P,
    ResBody = unknown
> = Request<P, ResBody, unknown, ParsedQs>;

// === Params + Query ===
export type ValidatedParamsQuery<
    P extends ZodSchema,
    Q extends ZodSchema,
    ResBody = unknown
> = Request<Infer<P>, ResBody, unknown, Infer<Q>>;

export type ValidatedParamsQueryT<
    P,
    Q,
    ResBody = unknown
> = Request<P, ResBody, unknown, Q>;

// === Params + Body ===
export type ValidatedParamsBody<
    P extends ZodSchema,
    B extends ZodSchema,
    ResBody = unknown
> = Request<Infer<P>, ResBody, Infer<B>, ParsedQs>;

export type ValidatedParamsBodyT<
    P,
    B,
    ResBody = unknown
> = Request<P, ResBody, B, ParsedQs>;


// === Full Request: Params + Query + Body ===
export type ValidatedRequestFull<
    P extends ZodSchema,
    Q extends ZodSchema,
    B extends ZodSchema,
    ResBody = unknown
> = Request<Infer<P>, ResBody, Infer<B>, Infer<Q>>;

export type ValidatedRequestFullT<
    P,
    Q,
    B,
    ResBody = unknown
> = Request<P, ResBody, B, Q>;

export type ValidatedNoInput<ResBody = unknown> = Request<
    Record<string, string>, // params
    ResBody,                // response body
    unknown,                // body
    ParsedQs                // query
>;

