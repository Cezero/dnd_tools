import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

import {
    initializeSession,
    getSessionState,
    applyUpdate,
    saveSession,
    cancelSession,
    type SessionControllerConfig
} from './GenericSessionController';
import { GenericSessionService } from './GenericSessionService';
import { getRedisClient } from './redisClient';
import type { SessionConfig } from './types';
import type { AuthUser } from '@shared/schema';

/**
 * Tests for GenericSessionController.
 * 
 * These tests verify that the generic controller functions correctly handle
 * session operations for different entity types.
 */

describe('GenericSessionController', () => {
    let sessionService: GenericSessionService<number, TestState>;
    let mockReq: Partial<Request & { user?: AuthUser }>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    interface TestState {
        name: string;
        value: number;
    }

    interface TestEntity {
        name: string;
        value: number;
    }

    type TestUpdate =
        | { type: 0; payload: { field: string; value: unknown } }
        | { type: 1; payload: { item: string } };

    const testSessionConfig: SessionConfig<number, TestState> = {
        entityType: 'class',
        buildSessionKey: (entityId, userId) => `${entityId}:${userId}`
    };

    const testControllerConfig: SessionControllerConfig<number, TestState, TestUpdate, TestEntity> = {
        entityService: {
            getById: async (id: number) => {
                if (id === 1) {
                    return { name: 'Test Entity', value: 42 };
                }
                return null;
            }
        },
        sessionService: {} as GenericSessionService<number, TestState>,
        buildInitialState: (entity: TestEntity, entityId: number): TestState => {
            return {
                name: entity.name,
                value: entity.value
            };
        },
        updateApplierConfig: {
            applyFieldUpdate: (state, field, value) => ({ ...state, [field]: value }),
            isFieldUpdate: (update) => update.type === 0,
            extractFieldUpdate: (update) => {
                if (update.type === 0) {
                    return { field: update.payload.field, value: update.payload.value };
                }
                return null;
            },
            isProgressionUpdate: () => false,
            applyProgressionUpdate: (state) => state,
            isEntityUpdate: () => false,
            applyEntityUpdate: (state) => state,
            isSpecialUpdate: () => false,
            applySpecialUpdate: (state) => state
        },
        saveService: {
            saveSessionToMySQL: async (entityId: number, state: TestState) => {
                // Mock save - just verify it's called
            }
        },
        getEntityIdFromParams: (params) => {
            const id = typeof params.entityId === 'string' ? parseInt(params.entityId, 10) : params.entityId;
            return isNaN(id as number) ? null : (id as number);
        },
        getSessionIdFromParams: (params) => {
            return typeof params.sessionId === 'string' ? params.sessionId : null;
        }
    };

    beforeEach(async () => {
        // Note: Tests require Redis to be running
        // For local development, ensure Redis is running on localhost:6379
        // For CI/CD, use a Redis test container or mock Redis client

        // Flush all keys for clean test state
        const redis = getRedisClient();
        await redis.flushAll();

        sessionService = new GenericSessionService(testSessionConfig);
        testControllerConfig.sessionService = sessionService;

        mockReq = {
            user: { id: 100, username: 'testuser', isAdmin: false },
            params: {},
            body: {}
        };

        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        };

        mockNext = vi.fn();
    });

    afterEach(async () => {
        // Clean up test keys
        const redis = getRedisClient();
        const keys = await redis.keys('session:class:*');
        if (keys.length > 0) {
            await redis.del(keys);
        }
        sessionService.destroy();
    });

    describe('initializeSession', () => {
        it('should create a new session when none exists', async () => {
            mockReq.params = { entityId: '1' };

            await initializeSession(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, unknown, TestEntity>
            );

            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    sessionId: expect.any(String),
                    state: expect.objectContaining({
                        name: 'Test Entity',
                        value: 42
                    })
                })
            );
        });

        it('should return existing session if one exists', async () => {
            mockReq.params = { entityId: '1' };

            // Create a session first
            const initialState: TestState = { name: 'Test Entity', value: 42 };
            const session = await sessionService.createSession(1, 100, initialState);

            await initializeSession(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, unknown, TestEntity>
            );

            expect(mockRes.json).toHaveBeenCalledWith({
                sessionId: session.id,
                state: initialState
            });
        });

        it('should return 401 if user not authenticated', async () => {
            mockReq.user = undefined;
            mockReq.params = { entityId: '1' };

            await initializeSession(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, unknown, TestEntity>
            );

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
        });

        it('should return 400 if entity ID is invalid', async () => {
            mockReq.params = { entityId: 'invalid' };

            await initializeSession(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, unknown, TestEntity>
            );

            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid entity ID' });
        });

        it('should return 404 if entity not found', async () => {
            mockReq.params = { entityId: '999' };

            await initializeSession(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, unknown, TestEntity>
            );

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Entity not found' });
        });
    });

    describe('getSessionState', () => {
        it('should return session state for valid session', async () => {
            const initialState: TestState = { name: 'Test Entity', value: 42 };
            const session = await sessionService.createSession(1, 100, initialState);

            mockReq.params = { entityId: '1', sessionId: session.id };

            await getSessionState(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, unknown, unknown>
            );

            expect(mockRes.json).toHaveBeenCalledWith({
                state: initialState
            });
        });

        it('should return 404 if session not found', async () => {
            mockReq.params = { entityId: '1', sessionId: 'non-existent-id' };

            await getSessionState(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, unknown, unknown>
            );

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Session not found' });
        });

        it('should return 404 if session belongs to different user', async () => {
            const initialState: TestState = { name: 'Test Entity', value: 42 };
            const session = await sessionService.createSession(1, 200, initialState); // Different user

            mockReq.params = { entityId: '1', sessionId: session.id };

            await getSessionState(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, unknown, unknown>
            );

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Session not found' });
        });
    });

    describe('applyUpdate', () => {
        it('should apply update and return updated state', async () => {
            const initialState: TestState = { name: 'Test Entity', value: 42 };
            const session = await sessionService.createSession(1, 100, initialState);

            mockReq.params = { entityId: '1', sessionId: session.id };
            mockReq.body = {
                update: { type: 0, payload: { field: 'name', value: 'Updated Name' } }
            };

            await applyUpdate(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, TestUpdate, unknown>
            );

            expect(mockRes.json).toHaveBeenCalledWith({
                state: expect.objectContaining({
                    name: 'Updated Name',
                    value: 42
                })
            });

            // Verify session was updated
            const updatedSession = await sessionService.getSessionById(session.id);
            expect(updatedSession?.state.name).toBe('Updated Name');
        });

        it('should return 404 if session not found', async () => {
            mockReq.params = { entityId: '1', sessionId: 'non-existent-id' };
            mockReq.body = {
                update: { type: 0, payload: { field: 'name', value: 'Updated Name' } }
            };

            await applyUpdate(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, TestUpdate, unknown>
            );

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Session not found' });
        });
    });

    describe('saveSession', () => {
        it('should save session to MySQL and return updated entity', async () => {
            const initialState: TestState = { name: 'Test Entity', value: 42 };
            const session = await sessionService.createSession(1, 100, initialState);

            mockReq.params = { entityId: '1', sessionId: session.id };

            const saveSpy = vi.spyOn(testControllerConfig.saveService, 'saveSessionToMySQL');

            await saveSession(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, unknown, TestEntity>
            );

            expect(saveSpy).toHaveBeenCalledWith(1, initialState);
            expect(mockRes.json).toHaveBeenCalledWith({
                entity: expect.objectContaining({
                    name: 'Test Entity',
                    value: 42
                })
            });

            // Verify session was deleted
            const deletedSession = await sessionService.getSessionById(session.id);
            expect(deletedSession).toBeNull();
        });

        it('should return 404 if session not found', async () => {
            mockReq.params = { entityId: '1', sessionId: 'non-existent-id' };

            await saveSession(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, unknown, TestEntity>
            );

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Session not found' });
        });
    });

    describe('cancelSession', () => {
        it('should delete session and return success message', async () => {
            const initialState: TestState = { name: 'Test Entity', value: 42 };
            const session = await sessionService.createSession(1, 100, initialState);

            mockReq.params = { entityId: '1', sessionId: session.id };

            await cancelSession(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, unknown, unknown>
            );

            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Session cancelled successfully'
            });

            // Verify session was deleted
            const deletedSession = await sessionService.getSessionById(session.id);
            expect(deletedSession).toBeNull();
        });

        it('should return 404 if session not found', async () => {
            mockReq.params = { entityId: '1', sessionId: 'non-existent-id' };

            await cancelSession(
                mockReq as Request,
                mockRes as Response,
                mockNext,
                testControllerConfig as unknown as SessionControllerConfig<number, TestState, unknown, unknown>
            );

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Session not found' });
        });
    });
});
