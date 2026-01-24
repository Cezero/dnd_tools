import type { ZodErrorLike } from './types';

/**
 * Runtime guard for errors thrown by Zod schema parsing.
 *
 * We intentionally avoid importing `zod` in the backend app layer; instead we treat Zod
 * errors structurally via the `issues` array shape.
 */
export function isZodErrorLike(error: unknown): error is ZodErrorLike {
    if (typeof error !== 'object' || error === null) {
        return false;
    }

    if (!('issues' in error)) {
        return false;
    }

    const maybeIssues = (error as { issues?: unknown }).issues;
    return Array.isArray(maybeIssues);
}

