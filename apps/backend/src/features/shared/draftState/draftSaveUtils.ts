import { ValidationErrorWithPaths } from '../utils';
import { isZodErrorLike } from './zodErrorUtils';

/**
 * Parse and validate a draft state payload, converting Zod validation errors into
 * `ValidationErrorWithPaths` so the frontend can display field-level errors.
 *
 * This helper centralizes the common pattern used by draft save services:
 * - accept flexible JSON from Redis
 * - validate/coerce using the shared-schema `*.Schema.parse`
 * - map Zod errors to user-facing field paths
 *
 * @param parse - Zod parse function for the draft state (e.g. `ClassDraftStateSchema.parse`)
 * @param state - Draft state payload (typed state or flexible JSON)
 * @returns The validated/coerced draft state
 * @throws ValidationErrorWithPaths if schema validation fails
 */
export function parseDraftState<TState>(
    parse: (input: unknown) => TState,
    state: TState | Record<string, unknown>
): TState {
    try {
        return parse(state);
    } catch (error) {
        if (isZodErrorLike(error)) {
            throw new ValidationErrorWithPaths(
                error.issues.map((issue) => ({
                    path: issue.path.map((segment) => String(segment)).join('.') || 'root',
                    message: issue.message,
                    code: issue.code,
                }))
            );
        }
        throw error;
    }
}

