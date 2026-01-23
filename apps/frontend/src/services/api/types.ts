import type { DraftRef, UserSessionResponse as UserSessionResponseSchema } from '@shared/schema';

/**
 * Entity reference type for tracking which entities a user is viewing/editing.
 * 
 * @deprecated Use DraftRef from @shared/schema instead
 */
export type EntityRef = DraftRef;

/**
 * User session response type.
 * 
 * Re-exported from @shared/schema for convenience.
 */
export type UserSessionResponse = UserSessionResponseSchema;
