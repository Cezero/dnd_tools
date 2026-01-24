import { z } from 'zod';

import { ResolvedCharacterResultSchema } from './character.js';

/**
 * WebSocket message schemas shared between frontend and backend.
 *
 * The backend currently supports draft-state subscriptions via `{ type: 'subscribe', entityType, entityId }`.
 * This file introduces topic subscriptions for non-draft projections (e.g., resolved character) while
 * keeping the existing protocol available for backward compatibility.
 */

// -----------------------------
// Client -> Server
// -----------------------------

// TODO all of these literals should be a numeric enum in static-data

export const WebSocketSubscribeDraftSchema = z.object({
    type: z.literal('subscribe'),
    /** String representation of numeric DraftType (legacy protocol). */
    entityType: z.string(),
    entityId: z.number().int(),
});

export const WebSocketUnsubscribeDraftSchema = z.object({
    type: z.literal('unsubscribe'),
    entityType: z.string(),
    entityId: z.number().int(),
});

// another literal that should be a numeric enum in static-data

export const WebSocketTopicSchema = z.enum([
    'characterResolved',
]);

export const WebSocketSubscribeTopicSchema = z.object({
    type: z.literal('subscribeTopic'),
    topic: WebSocketTopicSchema,
    /** Topic ID (e.g., characterId for characterResolved). */
    topicId: z.number().int(),
});

export const WebSocketUnsubscribeTopicSchema = z.object({
    type: z.literal('unsubscribeTopic'),
    topic: WebSocketTopicSchema,
    topicId: z.number().int(),
});

export const WebSocketClientMessageSchema = z.union([
    WebSocketSubscribeDraftSchema,
    WebSocketUnsubscribeDraftSchema,
    WebSocketSubscribeTopicSchema,
    WebSocketUnsubscribeTopicSchema,
]);

export type WebSocketClientMessage = z.infer<typeof WebSocketClientMessageSchema>;

// -----------------------------
// Server -> Client
// -----------------------------

export const WebSocketStateUpdateSchema = z.object({
    type: z.literal('stateUpdate'),
    entityType: z.string(),
    entityId: z.number().int(),
    state: z.unknown(),
});

export const WebSocketTopicUpdateSchema = z.object({
    type: z.literal('topicUpdate'),
    topic: WebSocketTopicSchema,
    topicId: z.number().int(),
    /**
     * Topic payload.
     *
     * For `characterResolved`, payload is the resolved character snapshot.
     */
    payload: z.union([
        ResolvedCharacterResultSchema,
        z.unknown(),
    ]),
});

export const WebSocketErrorSchema = z.object({
    type: z.literal('error'),
    message: z.string(),
});

export const WebSocketServerMessageSchema = z.union([
    WebSocketStateUpdateSchema,
    WebSocketTopicUpdateSchema,
    WebSocketErrorSchema,
]);

export type WebSocketServerMessage = z.infer<typeof WebSocketServerMessageSchema>;

