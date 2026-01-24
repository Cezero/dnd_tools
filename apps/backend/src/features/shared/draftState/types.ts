/**
 * Types for the draft state feature.
 *
 * These interfaces are intentionally colocated with the draft-state feature and
 * imported by implementation files (registry/controller/services) to keep
 * type definitions out of runtime modules.
 */

export interface ZodIssueLike {
    path: Array<string | number>;
    message: string;
    code: string;
}

export interface ZodErrorLike {
    issues: ZodIssueLike[];
}

/**
 * Minimal schema contract used by the backend draft system.
 *
 * In practice this is implemented by Zod schemas exported from `@shared/schema`,
 * but the backend treats it as a simple parse contract to avoid importing `zod`
 * (and referencing Zod types) in application code.
 */
export interface DraftEditStateSchema<TState> {
    /**
     * Validate/coerce a draft state payload.
     */
    parse: (input: unknown) => TState;
}

/**
 * Draft configuration interface for the draft registry.
 *
 * Maps draft types to their edit-state schema, save service, and initialization logic.
 */
export interface DraftConfig<TState = unknown> {
    /**
     * Schema used to validate draft state loaded from Redis before saving.
     */
    editStateSchema: DraftEditStateSchema<TState>;

    /**
     * Save service that handles persisting state to the database.
     *
     * Must have a `saveSessionToMySQL` method that takes `(id, state, userId)` and returns the
     * draft id (may be newly created for new drafts).
     */
    saveService: {
        saveSessionToMySQL(id: number, state: TState | Record<string, unknown>, userId: number): Promise<number>;
    };

    /**
     * Function that builds initial draft state from database record.
     *
     * Accepts id, fetches record using existing service, and returns initial draft state.
     */
    getInitialState: (id: number) => Promise<TState>;

    /**
     * Function that builds initial draft state for new draft instances.
     *
     * Called when the client requests `startEditing` with `id = 0` and the backend mints a new negative draft id.
     */
    getInitialCreateState: (draftId: number, userId: number) => Promise<TState>;

    /**
     * Optional callback that is called after state updates.
     *
     * For character, this triggers resolution and WebSocket publish.
     */
    onStateUpdate?: (id: number, state: TState, userId: number) => Promise<void>;
}

