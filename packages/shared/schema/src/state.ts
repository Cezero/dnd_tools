import { z } from 'zod';

import { DraftAction, DraftType } from '@shared/static-data';

import { numericParam } from './common.js';
import { ValidationErrorResponseSchema } from './validation.js';

/**
 * Draft context payload for starting and updating drafts.
 *
 * Draft context is primarily used when `id = 0` (minted draft id) and the backend needs
 * additional information to initialize the draft state (e.g., which character/level an
 * Advancement draft belongs to).
 *
 * Note: `characterId` must support negative draft-only IDs during character creation.
 */
export const AdvancementDraftModeSchema = z.enum([
    'create',
    'edit-current',
    'level-up',
    // Future workflow stub (out of scope for current implementation plan)
    'retrain',
]);

export const AdvancementDraftContextSchema = z.object({
    characterId: z.number().int(),
    level: z.number().int().min(1, 'Level must be at least 1'),
    mode: AdvancementDraftModeSchema,
});

/**
 * DraftContextSchema is intentionally permissive so the generic draft API can evolve without
 * introducing breaking changes across all callers. Backend services should validate context
 * more strictly based on `draftType`.
 */
export const DraftContextSchema = z.unknown();

/**
 * Schema for draft reference requests (draftType and id).
 * 
 * Used in user session APIs for tracking which drafts a user is viewing or editing.
 * These represent transient drafts of changes that may be discarded or persisted.
 * 
 * Note: "Draft" naming is used instead of "Entity" to:
 * - Reflect the transient nature of these schemas (temporary drafts)
 * - Avoid confusion with `FeatureEntity` (which represents a feature entity in the feature system)
 * 
 * @example
 * ```typescript
 * {
 *   draftType: DraftType.Feature,
 *   id: 123
 * }
 * ```
 */
export const DraftRefRequestSchema = z.object({
    /**
     * The draft type (e.g., DraftType.Feature, DraftType.Class, DraftType.Race, DraftType.Character).
     * Uses numeric enum for type safety and to avoid string comparisons.
     */
    draftType: z.enum(DraftType),

    /**
     * The draft ID.
     * Use:
     * - 0 to request a new draft instance from the backend (minted negative draft id)
     * - a negative integer for a draft-only instance (not yet persisted)
     * - a positive integer for an existing persisted entity draft
     */
    id: z.number().int(),

    /**
     * Optional draft initialization context.
     *
     * Used when `id = 0` and the backend needs extra information to build an initial draft
     * state (e.g., `{ characterId, level, mode }` for `DraftType.Advancement`).
     */
    context: DraftContextSchema.optional(),
});

export type DraftRefRequest = z.infer<typeof DraftRefRequestSchema>;

/**
 * Schema for draft reference query parameters (used in DELETE requests).
 * 
 * Same structure as DraftRefRequestSchema but used for query parameters.
 * draftType is accepted as a number (the enum value) and will be validated.
 * 
 * @example
 * ```typescript
 * {
 *   draftType: DraftType.Feature,  // or as number: 3
 *   id: "123"  // Will be parsed to number
 * }
 * ```
 */
export const DraftRefQuerySchema = z.object({
    /**
     * The draft type (e.g., DraftType.Feature, DraftType.Class, DraftType.Race, DraftType.Character).
     * Can be passed as number (enum value) in query params.
     */
    draftType: z.preprocess(
        (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
        z.enum(DraftType)
    ),

    /**
     * The draft ID (as string for query params, will be parsed to number).
     */
    id: z.string().regex(/^-?\d+$/, 'Draft ID must be a number').transform((val) => parseInt(val, 10)),
});

export type DraftRefQuery = z.infer<typeof DraftRefQuerySchema>;
export type DraftRefQueryInput = z.input<typeof DraftRefQuerySchema>;

/**
 * Schema for optional draft reference query parameters (used in DELETE requests).
 * 
 * Used when query parameters may be optional (e.g., clear all vs clear specific draft).
 * 
 * @example
 * ```typescript
 * {
 *   draftType: DraftType.Feature,  // optional
 *   id: "123"                       // optional, will be parsed to number
 * }
 * ```
 */
export const DraftRefQueryOptionalSchema = z.object({
    /**
     * The draft type (e.g., DraftType.Feature, DraftType.Class, DraftType.Race, DraftType.Character).
     * Can be passed as number (enum value) in query params.
     */
    draftType: z.preprocess(
        (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
        z.enum(DraftType).optional()
    ),

    /**
     * The draft ID (as string for query params, will be parsed to number).
     */
    id: z.preprocess(
        (val) => (typeof val === 'string' && val !== '' ? parseInt(val, 10) : undefined),
        z.number().int().optional()
    ),
});

export type DraftRefQueryOptional = z.infer<typeof DraftRefQueryOptionalSchema>;


/**
 * Schema for draft reference (used in user session responses).
 * 
 * Represents a reference to a transient draft being viewed or edited.
 * 
 * @example
 * ```typescript
 * {
 *   draftType: DraftType.Feature,
 *   id: 123
 * }
 * ```
 */
export const DraftRefSchema = z.object({
    /**
     * The draft type (e.g., DraftType.Feature, DraftType.Class, DraftType.Race, DraftType.Character).
     * Uses numeric enum for type safety and to avoid string comparisons.
     */
    draftType: z.enum(DraftType),

    /**
     * The draft ID.
     */
    id: z.number().int(),
});

export type DraftRef = z.infer<typeof DraftRefSchema>;

/**
 * Schema for draft save response (used for draft/session operations and saving drafts to database).
 * 
 * Returns success with draftType and id on success, or validation errors on failure.
 * For session operations, draftType and id are optional to support operations that don't target
 * a specific draft (e.g., clearing all editing drafts).
 * For saving drafts to database, draftType and id are required and id must be positive.
 * 
 * @example
 * ```typescript
 * // Success case (saving draft):
 * { success: true, draftType: DraftType.Class, id: 123 }
 * 
 * // Success case (session operation with specific draft):
 * { success: true, draftType: DraftType.Feature, id: 123 }
 * 
 * // Success case (session operation without specific draft):
 * { success: true }
 * 
 * // Validation error case:
 * { errors: [...] }
 * ```
 */
export const DraftSaveResponseSchema = z.union([
    DraftRefSchema.partial({ draftType: true, id: true }).extend({
        success: z.boolean(),
    }),
    ValidationErrorResponseSchema,
]);

export type DraftSaveResponse = z.infer<typeof DraftSaveResponseSchema>;

/**
 * Schema for user session response.
 * 
 * @example
 * ```typescript
 * {
 *   viewing: [{ draftType: DraftType.Feature, id: 123 }],
 *   editing: [{ draftType: DraftType.Class, id: 456 }]
 * }
 * ```
 */
export const UserSessionResponseSchema = z.object({
    viewing: z.array(DraftRefSchema),
    editing: z.array(DraftRefSchema),
});

export type UserSessionResponse = z.infer<typeof UserSessionResponseSchema>;

/**
 * Schema for admin session information.
 * 
 * Used in admin session monitoring endpoints.
 */
export const AdminSessionInfoSchema = z.object({
    userId: z.number().int(),
    userName: z.string(),
    viewing: z.array(DraftRefSchema), // Uses draftType/id
    editing: z.array(DraftRefSchema), // Uses draftType/id
    sessionKey: z.string(),
});

export type AdminSessionInfo = z.infer<typeof AdminSessionInfoSchema>;

/**
 * Schema for draft state information.
 * 
 * Used in admin session monitoring endpoints.
 */
export const DraftStateInfoSchema = z.object({
    /**
     * The draft type (e.g., DraftType.Feature, DraftType.Class, DraftType.Race, DraftType.Character).
     * Uses numeric enum for type safety and to avoid string comparisons.
     */
    draftType: z.enum(DraftType),

    /**
     * The draft ID.
     */
    id: z.number().int(),

    hasState: z.boolean(),
    lastUpdated: z.string().datetime().nullable(), // ISO 8601 string, will be converted to Date on frontend
});

export type DraftStateInfo = z.infer<typeof DraftStateInfoSchema>;

/**
 * Schema for draft lock information.
 * 
 * Used in admin session monitoring endpoints.
 */
export const DraftLockInfoSchema = z.object({
    /**
     * The draft type (e.g., DraftType.Feature, DraftType.Class, DraftType.Race, DraftType.Character).
     * Uses numeric enum for type safety and to avoid string comparisons.
     */
    draftType: z.enum(DraftType),

    /**
     * The draft ID.
     */
    id: z.number().int(),

    lockedBy: z.number().int(),
    lockedByUserName: z.string().nullable(),
    lockedAt: z.string().datetime().nullable(), // ISO 8601 string, will be converted to Date on frontend
});

export type DraftLockInfo = z.infer<typeof DraftLockInfoSchema>;

/**
 * Schema for WebSocket subscription information.
 * 
 * Used in admin session monitoring endpoints.
 */
export const WebSocketSubscriptionInfoSchema = z.object({
    clientId: z.string(),
    userId: z.number().int().nullable(),
    userName: z.string().nullable(),
    subscriptions: z.array(DraftRefSchema),
});

export type WebSocketSubscriptionInfo = z.infer<typeof WebSocketSubscriptionInfoSchema>;

/**
 * Response schema for array of admin session info.
 */
export const AdminSessionsResponseSchema = z.array(AdminSessionInfoSchema);

/**
 * Response schema for array of draft state info.
 */
export const DraftStatesResponseSchema = z.array(DraftStateInfoSchema);

/**
 * Response schema for array of draft lock info.
 */
export const DraftLocksResponseSchema = z.array(DraftLockInfoSchema);

/**
 * Response schema for array of WebSocket subscription info.
 */
export const WebSocketSubscriptionsResponseSchema = z.array(WebSocketSubscriptionInfoSchema);

/**
 * Schema for draft lock status response.
 * Used to indicate whether a draft is locked and by which user.
 */
export const DraftLockStatusSchema = z.object({
    locked: z.boolean(),
    lockedBy: z.number().int().positive().optional(),
});

export type DraftLockStatus = z.infer<typeof DraftLockStatusSchema>;

/**
 * Generic schema for updating state values by path.
 * Used by all entity types (Feature, Class, Race, Character, etc.) for path-based state updates.
 * 
 * @example
 * ```typescript
 * {
 *   draftType: DraftType.Class,
 *   id: 123,
 *   path: "name",
 *   value: "New Name"
 * }
 * ```
 * 
 * @example
 * ```typescript
 * {
 *   draftType: DraftType.Feature,
 *   id: 456,
 *   path: "entities.0.type",
 *   value: 4
 * }
 * ```
 */
export const UpdateStateValueSchema = DraftRefRequestSchema.extend({
    /**
     * The path to update using dot notation (e.g., "name", "entities.0.type", "sourceBookInfo.editionId").
     * Supports nested objects and array indices.
     */
    path: z.string().min(1, 'Path is required'),

    /**
     * The new value to set at the specified path.
     * Must be a scalar value.
     */
    value: z.union([z.string(), z.number(), z.boolean(), z.null()]),

    /**
     * Optional action controlling how the value is applied at the path.
     *
     * Default is DraftAction.Update to preserve existing behavior.
     */
    action: z.union([
        z.literal(DraftAction.Update),
        z.literal(DraftAction.Remove),
        z.literal(DraftAction.Add),
    ]).optional().default(DraftAction.Update),
});

export type UpdateStateValueRequest = z.infer<typeof UpdateStateValueSchema>;

/**
 * Generic response schema for state value updates.
 * Used by all entity types for path-based state updates.
 * 
 * State management is transparent to the frontend - responses only indicate success/failure.
 * Frontend should fetch updated data using normal services if needed.
 */
export const UpdateStateValueResponseSchema = z.object({
    /**
     * Indicates whether the update was successful.
     */
    success: z.boolean(),

    /**
     * Optional ID returned when DraftAction.Add creates a new nested object in a draft.
     *
     * This is a draft-stable temporary ID (typically a negative integer) that the frontend
     * can use for subsequent `byId` updates/removals before the parent draft is saved.
     */
    id: z.number().int().optional(),
});

export type UpdateStateValueResponse = z.infer<typeof UpdateStateValueResponseSchema>;

/**
 * Generic response schema for start editing operations.
 * Extends DraftRefSchema to include draftType and id for debugging purposes.
 */
export const StartEditingResponseSchema = DraftRefSchema.extend({
    success: z.boolean(),
});
export type StartEditingResponse = z.infer<typeof StartEditingResponseSchema>;

/**
 * Generic response schema for retrieving the current draft state from Redis.
 *
 * Notes:
 * - `state` is intentionally `unknown` because the concrete shape depends on `draftType`.
 * - Callers should validate/narrow the returned state based on `draftType` (e.g. using the
 *   corresponding edit-state schemas in `@shared/schema`).
 */
export const GetDraftStateResponseSchema = DraftRefSchema.extend({
    success: z.boolean(),
    state: z.unknown().nullable(),
});
export type GetDraftStateResponse = z.infer<typeof GetDraftStateResponseSchema>;


/**
 * Generic response schema for cancel editing operations.
 * Extends DraftRefSchema to include draftType and id for debugging purposes.
 */
export const CancelEditingResponseSchema = DraftRefSchema.extend({
    success: z.boolean(),
});
export type CancelEditingResponse = z.infer<typeof CancelEditingResponseSchema>;
