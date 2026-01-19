import { Response, NextFunction } from 'express';

import type { ValidatedParamsT, ValidatedParamsBodyT } from '@/util/validated-types';

import { GenericSessionService } from './GenericSessionService';
import { applyUpdateToState, type UpdateApplierConfig } from './GenericUpdateApplier';
import type { Session, SessionConfig } from './types';

/**
 * Configuration for generic session controller.
 * 
 * Provides all the dependencies and strategies needed for the controller
 * to handle session operations for a specific entity type.
 * 
 * @template TEntityId - The entity ID type (must extend number)
 * @template TState - The session state type
 * @template TUpdate - The update operation type (discriminated union)
 * @template TEntity - The entity type from the database
 */
export interface SessionControllerConfig<TEntityId extends number, TState, TUpdate, TEntity> {
    /** Service for retrieving entities by ID */
    entityService: {
        getById: (id: TEntityId) => Promise<TEntity | null>;
    };
    /** Generic session service instance */
    sessionService: GenericSessionService<TEntityId, TState>;
    /** Function to build initial state from entity data and entity ID */
    buildInitialState: (entity: TEntity, entityId: TEntityId) => TState;
    /** Update applier configuration */
    updateApplierConfig: UpdateApplierConfig<TState, TUpdate>;
    /** Service for saving session state to MySQL */
    saveService: {
        saveSessionToMySQL: (entityId: TEntityId, state: TState) => Promise<void>;
    };
    /** Function to get entity ID from request params */
    getEntityIdFromParams: (params: { [key: string]: string | number }) => TEntityId | null;
    /** Function to get session ID from request params */
    getSessionIdFromParams: (params: { [key: string]: string | number }) => string | null;
}

/**
 * Initialize a new editing session for an entity.
 * 
 * If an existing session exists for this entity/user combination, it is returned.
 * Otherwise, a new session is created with initial state built from the entity.
 * 
 * **Process**:
 * 1. Validates user authentication
 * 2. Retrieves entity from database
 * 3. Checks for existing session (returns if found)
 * 4. Builds initial state from entity data
 * 5. Creates new session in SQLite
 * 
 * **Response**: Returns `{ sessionId: string; state: TState }` on success
 * 
 * **Error Responses**:
 * - `401`: User not authenticated
 * - `400`: Invalid entity ID
 * - `404`: Entity not found
 * - `500`: Internal server error or session creation failure
 * 
 * @template TEntityId - The entity ID type
 * @template TState - The session state type
 * @template TEntity - The entity type
 * 
 * @param req - Express request with validated entity ID parameter
 * @param res - Express response
 * @param _next - Express next function
 * @param config - Controller configuration
 * 
 * @returns Promise that resolves when response is sent
 * 
 * @throws Never throws - all errors are handled and sent as HTTP responses
 * 
 * @example
 * // In classResolutionController.ts
 * export async function InitializeClassSession(req, res, next) {
 *   await initializeSession(req, res, next, {
 *     entityService: { getById: classService.getClassById },
 *     sessionService: classSessionService,
 *     buildInitialState: (cls, classId) => ({ classId, name: cls.name, ... }),
 *     updateApplierConfig: classUpdateApplierConfig,
 *     saveService: { saveSessionToMySQL: classSaveService.saveSessionToMySQL },
 *     getEntityIdFromParams: (params) => parseInt(params.classId),
 *     getSessionIdFromParams: (params) => params.sessionId
 *   });
 * }
 */
export async function initializeSession<TEntityId extends number, TState, TEntity>(
    req: ValidatedParamsT<{ [key: string]: string }, { sessionId: string; state: TState }>,
    res: Response,
    _next: NextFunction,
    config: SessionControllerConfig<TEntityId, TState, unknown, TEntity>
): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const entityId = config.getEntityIdFromParams(req.params);
    if (!entityId) {
        res.status(400).json({ error: 'Invalid entity ID' });
        return;
    }

    try {
        // Load entity
        const entity = await config.entityService.getById(entityId);
        if (!entity) {
            res.status(404).json({ error: 'Entity not found' });
            return;
        }

        // Check if session already exists
        const existingSession = await config.sessionService.getSession(entityId, userId);

        if (existingSession) {
            // Return existing session
            res.json({
                sessionId: existingSession.id,
                state: existingSession.state
            });
            return;
        }

        // Build initial state from entity data and entity ID
        const initialState = config.buildInitialState(entity, entityId);

        // Create new session
        const newSession = await config.sessionService.createSession(entityId, userId, initialState);

        res.json({
            sessionId: newSession.id,
            state: newSession.state
        });
    } catch (error) {
        console.error('Error initializing session:', error);
        res.status(500).json({ error: 'Failed to initialize session' });
    }
}

/**
 * Get current session state.
 * 
 * Retrieves the current state of an active session by session ID.
 * Validates that the session belongs to the authenticated user and matches the entity ID.
 * 
 * **Response**: Returns `{ state: TState }` on success
 * 
 * **Error Responses**:
 * - `401`: User not authenticated
 * - `400`: Invalid entity ID or session ID
 * - `404`: Session not found or doesn't belong to user/entity
 * - `500`: Internal server error
 * 
 * @template TEntityId - The entity ID type
 * @template TState - The session state type
 * 
 * @param req - Express request with validated entity ID and session ID parameters
 * @param res - Express response
 * @param _next - Express next function
 * @param config - Controller configuration
 * 
 * @returns Promise that resolves when response is sent
 * 
 * @throws Never throws - all errors are handled and sent as HTTP responses
 * 
 * @example
 * // In classResolutionController.ts
 * export async function GetClassSessionState(req, res, next) {
 *   await getSessionState(req, res, next, classSessionControllerConfig);
 * }
 */
export async function getSessionState<TEntityId extends number, TState>(
    req: ValidatedParamsT<{ [key: string]: string }, { state: TState }>,
    res: Response,
    _next: NextFunction,
    config: SessionControllerConfig<TEntityId, TState, unknown, unknown>
): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const entityId = config.getEntityIdFromParams(req.params);
    const sessionId = config.getSessionIdFromParams(req.params);

    if (!entityId) {
        res.status(400).json({ error: 'Invalid entity ID' });
        return;
    }

    if (!sessionId) {
        res.status(400).json({ error: 'Invalid session ID' });
        return;
    }

    try {
        const session = await config.sessionService.getSessionById(sessionId);

        if (!session || session.entityId !== entityId || session.userId !== userId) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        res.json({
            state: session.state
        });
    } catch (error) {
        console.error('Error getting session state:', error);
        res.status(500).json({ error: 'Failed to get session state' });
    }
}

/**
 * Apply an update to the session.
 * 
 * Applies an update operation to the session state and saves it back to SQLite.
 * Uses the configured update applier to handle entity-specific update logic.
 * 
 * **Update Types Supported**:
 * - Field updates (e.g., UPDATE_CLASS_FIELD)
 * - Progression updates (ADD_PROGRESSION, UPDATE_PROGRESSION, REMOVE_PROGRESSION)
 * - Entity updates (ADD_ENTITY, UPDATE_ENTITY, REMOVE_ENTITY)
 * - Special updates (entity-specific, e.g., SET_SPELLCASTING_PROGRESSION)
 * 
 * **Response**: Returns `{ state: TState }` with updated state on success
 * 
 * **Error Responses**:
 * - `401`: User not authenticated
 * - `400`: Invalid entity ID or session ID
 * - `404`: Session not found or doesn't belong to user/entity
 * - `500`: Internal server error or update application failure
 * 
 * @template TEntityId - The entity ID type
 * @template TState - The session state type
 * @template TUpdate - The update operation type
 * 
 * @param req - Express request with validated entity ID, session ID, and update body
 * @param res - Express response
 * @param _next - Express next function
 * @param config - Controller configuration
 * 
 * @returns Promise that resolves when response is sent
 * 
 * @throws Never throws - all errors are handled and sent as HTTP responses
 * 
 * @example
 * // In classResolutionController.ts
 * export async function ApplyClassUpdate(req, res, next) {
 *   await applyUpdate(req, res, next, classSessionControllerConfig);
 * }
 * 
 * // Request body:
 * // {
 * //   "update": {
 * //     "type": "UPDATE_CLASS_FIELD",
 * //     "payload": { "field": "name", "value": "New Name" }
 * //   }
 * // }
 */
export async function applyUpdate<TEntityId extends number, TState, TUpdate>(
    req: ValidatedParamsBodyT<{ [key: string]: string }, { update: TUpdate }>,
    res: Response,
    _next: NextFunction,
    config: SessionControllerConfig<TEntityId, TState, TUpdate, unknown>
): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const entityId = config.getEntityIdFromParams(req.params);
    const sessionId = config.getSessionIdFromParams(req.params);

    if (!entityId) {
        res.status(400).json({ error: 'Invalid entity ID' });
        return;
    }

    if (!sessionId) {
        res.status(400).json({ error: 'Invalid session ID' });
        return;
    }

    try {
        const session = await config.sessionService.getSessionById(sessionId);

        if (!session || session.entityId !== entityId || session.userId !== userId) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // Apply update to state
        const updatedState = applyUpdateToState(session.state, req.body.update, config.updateApplierConfig);

        // Update session
        await config.sessionService.updateSession(session.sessionKey, updatedState);

        res.json({
            state: updatedState
        });
    } catch (error) {
        console.error('Error applying update:', error);
        res.status(500).json({ error: 'Failed to apply update' });
    }
}

/**
 * Save session to MySQL.
 * 
 * Transforms the session state and saves it to MySQL, then deletes the session from SQLite.
 * Returns the updated entity after save.
 * 
 * **Process**:
 * 1. Validates session exists and belongs to user/entity
 * 2. Calls saveService to transform and persist state to MySQL
 * 3. Deletes session from SQLite
 * 4. Retrieves and returns updated entity
 * 
 * **Response**: Returns `{ entity: TEntity }` with the updated entity on success
 * 
 * **Error Responses**:
 * - `401`: User not authenticated
 * - `400`: Invalid entity ID or session ID
 * - `404`: Session not found, doesn't belong to user/entity, or entity not found after save
 * - `500`: Internal server error or save failure
 * 
 * @template TEntityId - The entity ID type
 * @template TState - The session state type
 * @template TEntity - The entity type
 * 
 * @param req - Express request with validated entity ID and session ID parameters
 * @param res - Express response
 * @param _next - Express next function
 * @param config - Controller configuration
 * 
 * @returns Promise that resolves when response is sent
 * 
 * @throws Never throws - all errors are handled and sent as HTTP responses
 * 
 * @example
 * // In classResolutionController.ts
 * export async function SaveClassSession(req, res, next) {
 *   await saveSession(req, res, next, classSessionControllerConfig);
 * }
 */
export async function saveSession<TEntityId extends number, TState, TEntity>(
    req: ValidatedParamsT<{ [key: string]: string }, { entity: TEntity }>,
    res: Response,
    _next: NextFunction,
    config: SessionControllerConfig<TEntityId, TState, unknown, TEntity>
): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const entityId = config.getEntityIdFromParams(req.params);
    const sessionId = config.getSessionIdFromParams(req.params);

    if (!entityId) {
        res.status(400).json({ error: 'Invalid entity ID' });
        return;
    }

    if (!sessionId) {
        res.status(400).json({ error: 'Invalid session ID' });
        return;
    }

    try {
        const session = await config.sessionService.getSessionById(sessionId);

        if (!session || session.entityId !== entityId || session.userId !== userId) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // Transform and save session state to MySQL
        await config.saveService.saveSessionToMySQL(entityId, session.state);

        // Delete session after save
        await config.sessionService.deleteSessionById(sessionId);

        // Return updated entity
        const updatedEntity = await config.entityService.getById(entityId);
        if (!updatedEntity) {
            res.status(404).json({ error: 'Entity not found after save' });
            return;
        }

        res.json({
            entity: updatedEntity
        });
    } catch (error) {
        console.error('Error saving session:', error);
        res.status(500).json({ error: 'Failed to save session' });
    }
}

/**
 * Cancel session (delete without saving).
 * 
 * Deletes the session from SQLite without saving to MySQL.
 * This is used when the user cancels editing without saving changes.
 * 
 * **Response**: Returns `{ message: string }` on success
 * 
 * **Error Responses**:
 * - `401`: User not authenticated
 * - `400`: Invalid entity ID or session ID
 * - `404`: Session not found or doesn't belong to user/entity
 * - `500`: Internal server error or deletion failure
 * 
 * @template TEntityId - The entity ID type
 * @template TState - The session state type
 * 
 * @param req - Express request with validated entity ID and session ID parameters
 * @param res - Express response
 * @param _next - Express next function
 * @param config - Controller configuration
 * 
 * @returns Promise that resolves when response is sent
 * 
 * @throws Never throws - all errors are handled and sent as HTTP responses
 * 
 * @example
 * // In classResolutionController.ts
 * export async function CancelClassSession(req, res, next) {
 *   await cancelSession(req, res, next, classSessionControllerConfig);
 * }
 */
export async function cancelSession<TEntityId extends number, TState>(
    req: ValidatedParamsT<{ [key: string]: string }, { message: string }>,
    res: Response,
    _next: NextFunction,
    config: SessionControllerConfig<TEntityId, TState, unknown, unknown>
): Promise<void> {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const entityId = config.getEntityIdFromParams(req.params);
    const sessionId = config.getSessionIdFromParams(req.params);

    if (!entityId) {
        res.status(400).json({ error: 'Invalid entity ID' });
        return;
    }

    if (!sessionId) {
        res.status(400).json({ error: 'Invalid session ID' });
        return;
    }

    try {
        const session = await config.sessionService.getSessionById(sessionId);

        if (!session || session.entityId !== entityId || session.userId !== userId) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        // Delete session
        await config.sessionService.deleteSessionById(sessionId);

        res.json({
            message: 'Session cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling session:', error);
        res.status(500).json({ error: 'Failed to cancel session' });
    }
}
