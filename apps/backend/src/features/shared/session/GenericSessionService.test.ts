import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { GenericSessionService } from './GenericSessionService';
import { getRedisClient } from './redisClient';
import type { SessionConfig } from './types';

/**
 * Tests for GenericSessionService.
 * 
 * **Note**: These tests require a Redis instance to be running.
 * For local development, ensure Redis is running on localhost:6379.
 * For CI/CD, use a Redis test container or mock Redis client.
 * 
 * These tests verify that the generic session service correctly handles
 * session operations for different entity types using Redis.
 */

describe('GenericSessionService', () => {
    let service: GenericSessionService<number, TestState>;

    interface TestState {
        name: string;
        value: number;
    }

    const testConfig: SessionConfig<number, TestState> = {
        entityType: 'class',
        buildSessionKey: (entityId, userId) => `${entityId}:${userId}`
    };

    beforeEach(async () => {
        // Ensure Redis is connected
        const redis = getRedisClient();
        // Flush all keys for clean test state
        await redis.flushAll();

        service = new GenericSessionService(testConfig);
    });

    afterEach(async () => {
        service.destroy();
        // Clean up test keys
        const redis = getRedisClient();
        const keys = await redis.keys('session:class:*');
        if (keys.length > 0) {
            await redis.del(keys);
        }
    });

    describe('createSession', () => {
        it('should create a new session', async () => {
            const state: TestState = { name: 'Test', value: 42 };
            const session = await service.createSession(1, 100, state);

            expect(session.id).toBeDefined();
            expect(session.entityId).toBe(1);
            expect(session.userId).toBe(100);
            expect(session.state).toEqual(state);
            expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
        });

        it('should delete existing session before creating new one', async () => {
            const state1: TestState = { name: 'Test1', value: 1 };
            const state2: TestState = { name: 'Test2', value: 2 };

            await service.createSession(1, 100, state1);
            const session2 = await service.createSession(1, 100, state2);

            // Should only have one session (old one deleted)
            const retrieved = await service.getSession(1, 100);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.state).toEqual(state2);
            expect(session2.state).toEqual(state2);
        });
    });

    describe('getSession', () => {
        it('should retrieve an active session', async () => {
            const state: TestState = { name: 'Test', value: 42 };
            const created = await service.createSession(1, 100, state);
            const retrieved = await service.getSession(1, 100);

            expect(retrieved).not.toBeNull();
            expect(retrieved?.id).toBe(created.id);
            expect(retrieved?.state).toEqual(state);
        });

        it('should return null for non-existent session', async () => {
            const retrieved = await service.getSession(999, 100);
            expect(retrieved).toBeNull();
        });

        it('should return null for expired session', async () => {
            const state: TestState = { name: 'Test', value: 42 };
            await service.createSession(1, 100, state);

            // Manually expire the session by deleting the key
            const redis = getRedisClient();
            await redis.del('session:class:1:100');

            const retrieved = await service.getSession(1, 100);
            expect(retrieved).toBeNull();
        });
    });

    describe('updateSession', () => {
        it('should update session state', async () => {
            const initialState: TestState = { name: 'Test', value: 42 };
            const session = await service.createSession(1, 100, initialState);

            const updatedState: TestState = { name: 'Updated', value: 100 };
            await service.updateSession(session.sessionKey, updatedState);

            const retrieved = await service.getSession(1, 100);
            expect(retrieved?.state).toEqual(updatedState);
        });

        it('should extend expiration time on update', async () => {
            const state: TestState = { name: 'Test', value: 42 };
            const session = await service.createSession(1, 100, state);
            const originalExpiry = session.expiresAt.getTime();

            // Wait a bit and update
            await new Promise(resolve => setTimeout(resolve, 10));
            await service.updateSession(session.sessionKey, state);

            const retrieved = await service.getSession(1, 100);
            expect(retrieved?.expiresAt.getTime()).toBeGreaterThan(originalExpiry);
        });
    });

    describe('deleteSession', () => {
        it('should delete session by session key', async () => {
            const state: TestState = { name: 'Test', value: 42 };
            await service.createSession(1, 100, state);

            await service.deleteSession('1:100');

            const retrieved = await service.getSession(1, 100);
            expect(retrieved).toBeNull();
        });

        it('should delete session by session ID', async () => {
            const state: TestState = { name: 'Test', value: 42 };
            const session = await service.createSession(1, 100, state);

            await service.deleteSessionById(session.id);

            const retrieved = await service.getSession(1, 100);
            expect(retrieved).toBeNull();
        });
    });

    describe('cleanupExpiredSessions', () => {
        it('should return 0 (Redis handles expiration automatically)', async () => {
            const state: TestState = { name: 'Test', value: 42 };
            await service.createSession(1, 100, state);

            // Redis TTL handles expiration automatically
            const deleted = await service.cleanupExpiredSessions();
            expect(deleted).toBe(0);

            // Session should still exist (not expired yet)
            const retrieved = await service.getSession(1, 100);
            expect(retrieved).not.toBeNull();
        });
    });
});
