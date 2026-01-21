import { v4 as uuidv4 } from 'uuid';

import type { CharacterWithAllDetailsResponse, ClassSpellSelection, DnDClass, FeatInQueryResponse } from '@shared/schema';

import type { CharacterEditState, ResolutionResult } from './types';
import { getRedisClient } from '../shared/session/redisClient';
import type { RedisSessionClient } from '../shared/session/types';

/**
 * Extended resolution result with derived data for frontend
 * 
 * **Feat Data Distinction**:
 * - `availableFeatsCount` (number): Count of feat slots/choices available to the character. Answers "How many feats can you select?"
 * - `qualifiedFeats` (array): List of feats the character qualifies for based on prerequisites, proficiencies, etc. Answers "Which feats can you select from?"
 */
export interface ResolvedCharacterResult extends ResolutionResult {
    classSkills: Array<{ skillId: number; skillSubId: number | null }>;
    skillBonuses: Array<{ skillId: number; skillSubId: number | null; bonus: number; source: string }>;
    grantedFeats: number[];
    /** Count of feat slots/choices available to the character. Calculated from resolved features. */
    availableFeatsCount: number;
    availableFighterBonusFeats: number;
    /** List of feats the character qualifies for, filtered by prerequisites, proficiencies, owned feats, etc. */
    qualifiedFeats: FeatInQueryResponse[];
    spellSelection?: Record<string, ClassSpellSelection>;
    /** Map of entity IDs to resolved formula values. Keyed by entity ID (or composite key). Used for BAB, saves, and other formula-based mechanics. */
    resolvedFormulaValues?: Record<string, number>;
    effectiveClassDetails?: DnDClass | null;
    sessionId: string;
}

/**
 * Character session stored in Redis
 */
interface CharacterSession {
    id: string;
    characterId: number;
    userId: number;
    sessionKey: string;
    characterState: CharacterEditState;
    resolvedResult: ResolvedCharacterResult;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}

/**
 * Internal session data structure stored in Redis
 */
interface CharacterSessionData {
    id: string;
    characterId: number;
    userId: number;
    sessionKey: string;
    characterState: CharacterEditState;
    resolvedResult: ResolvedCharacterResult;
    createdAt: number;
    updatedAt: number;
    expiresAt: number;
}

/**
 * Builds Redis key for session by session key.
 */
function buildSessionKey(sessionKey: string): string {
    return `session:character:${sessionKey}`;
}

/**
 * Builds Redis key for session by session ID.
 */
function buildSessionIdKey(sessionId: string): string {
    return `session:character:id:${sessionId}`;
}

/**
 * Builds Redis key for session index (reverse lookup from sessionKey to sessionId).
 */
function buildSessionIndexKey(sessionKey: string): string {
    return `session:character:index:${sessionKey}`;
}

/**
 * Service for managing character editing sessions in Redis.
 * 
 * Provides persistent session storage using Redis for scalable,
 * in-memory database operations. Sessions survive backend restarts and automatically
 * expire after a configurable period of inactivity using Redis TTL.
 * 
 * Features:
 * - Automatic expiration via Redis TTL (no manual cleanup needed)
 * - Session state persistence (character edits, resolved features)
 * - Per-user, per-character session isolation
 * - High-performance in-memory storage
 */
export class CharacterSessionService {
    private redis: RedisSessionClient;
    private readonly SESSION_TTL_SECONDS: number;

    constructor() {
        this.redis = getRedisClient();
        const ttlMinutes = parseInt(process.env.SESSION_EXPIRATION_MINUTES || '30', 10);
        this.SESSION_TTL_SECONDS = ttlMinutes * 60;
    }

    /**
     * Retrieves an active session for a character and user.
     * 
     * Only returns sessions that have not expired. Returns null if no active session exists.
     */
    async getSession(characterId: number, userId: number): Promise<CharacterSession | null> {
        try {
            const sessionKey = `${characterId}:${userId}`;
            const redisKey = buildSessionKey(sessionKey);
            const data = await this.redis.get(redisKey);

            if (!data) {
                return null;
            }

            let sessionData: CharacterSessionData;
            try {
                sessionData = JSON.parse(data) as CharacterSessionData;
            } catch (parseError) {
                console.error(`Failed to parse session data for key ${redisKey}:`, parseError);
                console.error('Raw data:', data);
                return null;
            }

            // Check if session has expired (backup check, though Redis TTL should handle this)
            if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
                return null;
            }

            return {
                id: sessionData.id,
                characterId: sessionData.characterId,
                userId: sessionData.userId,
                sessionKey: sessionData.sessionKey,
                characterState: sessionData.characterState,
                resolvedResult: sessionData.resolvedResult,
                createdAt: new Date(sessionData.createdAt),
                updatedAt: new Date(sessionData.updatedAt),
                expiresAt: new Date(sessionData.expiresAt)
            };
        } catch (error) {
            console.error(`Error retrieving session for character ${characterId}, user ${userId}:`, error);
            if (error instanceof Error) {
                console.error('Error stack:', error.stack);
            }
            throw error;
        }
    }

    /**
     * Retrieves a session by its unique session ID.
     * 
     * Only returns sessions that have not expired. Returns null if session not found or expired.
     */
    async getSessionById(sessionId: string): Promise<CharacterSession | null> {
        const redisKey = buildSessionIdKey(sessionId);
        const data = await this.redis.get(redisKey);

        if (!data) {
            return null;
        }

        const sessionData = JSON.parse(data) as CharacterSessionData;

        // Check if session has expired (backup check, though Redis TTL should handle this)
        if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
            return null;
        }

        return {
            id: sessionData.id,
            characterId: sessionData.characterId,
            userId: sessionData.userId,
            sessionKey: sessionData.sessionKey,
            characterState: sessionData.characterState,
            resolvedResult: sessionData.resolvedResult,
            createdAt: new Date(sessionData.createdAt),
            updatedAt: new Date(sessionData.updatedAt),
            expiresAt: new Date(sessionData.expiresAt)
        };
    }

    /**
     * Creates a new editing session for a character.
     * 
     * If an existing session exists for this character/user combination, it is deleted first.
     * The new session is assigned a unique ID and expiration time.
     */
    async createSession(
        character: CharacterWithAllDetailsResponse,
        userId: number,
        characterState: CharacterEditState,
        resolvedResult: ResolvedCharacterResult
    ): Promise<CharacterSession> {
        const sessionKey = `${character.id}:${userId}`;
        const now = Date.now();
        const expiresAt = now + (this.SESSION_TTL_SECONDS * 1000);

        // Delete any existing session for this character/user
        await this.deleteSession(sessionKey);

        const session: CharacterSession = {
            id: uuidv4(),
            characterId: character.id,
            userId,
            sessionKey,
            characterState,
            resolvedResult,
            createdAt: new Date(now),
            updatedAt: new Date(now),
            expiresAt: new Date(expiresAt)
        };

        // Prepare session data for storage
        const sessionData: CharacterSessionData = {
            id: session.id,
            characterId: session.characterId,
            userId: session.userId,
            sessionKey: session.sessionKey,
            characterState: session.characterState,
            resolvedResult: session.resolvedResult,
            createdAt: now,
            updatedAt: now,
            expiresAt: now + (this.SESSION_TTL_SECONDS * 1000)
        };

        const sessionRedisKey = buildSessionKey(sessionKey);
        const sessionIdRedisKey = buildSessionIdKey(session.id);
        const indexRedisKey = buildSessionIndexKey(sessionKey);

        // Store session data in Redis with TTL
        await Promise.all([
            this.redis.setEx(sessionRedisKey, this.SESSION_TTL_SECONDS, JSON.stringify(sessionData)),
            this.redis.setEx(sessionIdRedisKey, this.SESSION_TTL_SECONDS, JSON.stringify(sessionData)),
            this.redis.setEx(indexRedisKey, this.SESSION_TTL_SECONDS, session.id)
        ]);

        return session;
    }

    /**
     * Updates an existing session with new character state and resolved result.
     * 
     * **Spell Operation Integration**:
     * This method is called by `characterService.addSpellKnown()` and `removeSpellKnown()`
     * when an active resolution session exists. After a spell is added or removed:
     * 1. The character state is rebuilt from the updated character (including new/removed spells)
     * 2. Features are re-resolved using `CharacterResolutionService.resolveCharacterFeatures()`
     * 3. This method updates the session with the new character state and resolved result
     * 4. The session expiration time is extended
     * 
     * This ensures that the resolution session stays synchronized with the character's
     * spell state, allowing subsequent spell operations to use the updated resolved
     * features for validation.
     * 
     * @param sessionKey - The session key (characterId:userId) to update
     * @param characterState - Updated character edit state (includes new/removed spells)
     * @param resolvedResult - Updated resolved character result (includes new resolved features)
     * @throws Error if the session is not found
     * 
     * @see characterService.addSpellKnown - Calls this after adding a spell
     * @see characterService.removeSpellKnown - Calls this after removing a spell
     * @see CharacterResolutionService.resolveCharacterFeatures - Re-resolves features after spell changes
     */
    async updateSession(
        sessionKey: string,
        characterState: CharacterEditState,
        resolvedResult: ResolvedCharacterResult
    ): Promise<void> {
        const redisKey = buildSessionKey(sessionKey);
        const existingData = await this.redis.get(redisKey);

        if (!existingData) {
            throw new Error(`Session not found: ${sessionKey}`);
        }

        const existingSession = JSON.parse(existingData) as CharacterSessionData;
        const now = Date.now();
        const expiresAt = now + (this.SESSION_TTL_SECONDS * 1000);

        const updatedSessionData: CharacterSessionData = {
            ...existingSession,
            characterState,
            resolvedResult,
            updatedAt: now,
            expiresAt
        };

        const sessionIdRedisKey = buildSessionIdKey(existingSession.id);

        // Update session data and extend TTL
        await Promise.all([
            this.redis.setEx(redisKey, this.SESSION_TTL_SECONDS, JSON.stringify(updatedSessionData)),
            this.redis.setEx(sessionIdRedisKey, this.SESSION_TTL_SECONDS, JSON.stringify(updatedSessionData))
        ]);
    }

    /**
     * Deletes a session by its session key (characterId:userId).
     * 
     * Silently succeeds if the session doesn't exist.
     */
    async deleteSession(sessionKey: string): Promise<void> {
        const redisKey = buildSessionKey(sessionKey);
        const indexRedisKey = buildSessionIndexKey(sessionKey);

        // Get session ID from index for cleanup
        const sessionId = await this.redis.get(indexRedisKey);
        const sessionIdRedisKey = sessionId ? buildSessionIdKey(sessionId) : null;

        // Delete all related keys
        const keysToDelete = [redisKey, indexRedisKey];
        if (sessionIdRedisKey) {
            keysToDelete.push(sessionIdRedisKey);
        }

        if (keysToDelete.length > 0) {
            await this.redis.del(keysToDelete);
        }
    }

    /**
     * Deletes a session by its unique session ID.
     * 
     * Silently succeeds if the session doesn't exist.
     */
    async deleteSessionById(sessionId: string): Promise<void> {
        const sessionIdRedisKey = buildSessionIdKey(sessionId);
        const sessionData = await this.redis.get(sessionIdRedisKey);

        if (!sessionData) {
            return; // Session doesn't exist, silently succeed
        }

        const session = JSON.parse(sessionData) as CharacterSessionData;
        const sessionKey = session.sessionKey;

        // Delete all related keys
        const redisKey = buildSessionKey(sessionKey);
        const indexRedisKey = buildSessionIndexKey(sessionKey);

        await this.redis.del([redisKey, sessionIdRedisKey, indexRedisKey]);
    }

}
