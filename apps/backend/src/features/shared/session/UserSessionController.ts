import type { NextFunction, Response } from 'express';

import type { ValidatedParamsT } from '@/util/validated-types';
import { UserSessionService, type EntityRef } from './UserSessionService';

/**
 * Request body for adding a viewing entity.
 */
interface AddViewingEntityRequest {
    entityType: string;
    entityId: number;
}

/**
 * Request body for removing a viewing entity.
 */
interface RemoveViewingEntityRequest {
    entityType: string;
    entityId: number;
}

/**
 * Request body for setting an editing entity.
 */
interface SetEditingEntityRequest {
    entityType: string;
    entityId: number;
}

/**
 * Controller for user session management endpoints.
 * 
 * Provides endpoints for managing user sessions, including:
 * - Getting the current user's session
 * - Adding/removing viewing entities
 * - Setting/clearing editing entities
 * 
 * @see UserSessionService - For session management logic
 * @see packages/shared/docs/application-overview/entity-state-management.md - Full documentation
 */
export class UserSessionController {
    private userSessionService: UserSessionService;

    constructor() {
        this.userSessionService = new UserSessionService();
    }

    /**
     * Gets the current user's session.
     * 
     * GET /api/sessions/me
     */
    async getMySession(
        req: ValidatedParamsT<Record<string, never>, { viewing: EntityRef[]; editing: EntityRef[] }>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const session = await this.userSessionService.getUserSession(userId);

            if (!session) {
                // Return empty session if none exists
                res.json({
                    viewing: [],
                    editing: []
                });
                return;
            }

            res.json({
                viewing: session.viewing,
                editing: session.editing
            });
        } catch (error) {
            console.error('Error getting user session:', error);
            res.status(500).json({ error: 'Failed to get user session' });
        }
    }

    /**
     * Adds an entity to the user's viewing list.
     * 
     * POST /api/sessions/me/viewing
     */
    async addViewingEntity(
        req: ValidatedParamsT<Record<string, never>, AddViewingEntityRequest>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const body = req.body as AddViewingEntityRequest;
            const { entityType, entityId } = body;

            await this.userSessionService.addViewingEntity(userId, entityType, entityId);

            res.json({ success: true });
        } catch (error) {
            console.error('Error adding viewing entity:', error);
            res.status(500).json({ error: 'Failed to add viewing entity' });
        }
    }

    /**
     * Removes an entity from the user's viewing list.
     * 
     * DELETE /api/sessions/me/viewing
     */
    async removeViewingEntity(
        req: ValidatedParamsT<Record<string, never>, RemoveViewingEntityRequest>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const body = req.body as RemoveViewingEntityRequest;
            const { entityType, entityId } = body;

            await this.userSessionService.removeViewingEntity(userId, entityType, entityId);

            res.json({ success: true });
        } catch (error) {
            console.error('Error removing viewing entity:', error);
            res.status(500).json({ error: 'Failed to remove viewing entity' });
        }
    }

    /**
     * Sets the entity the user is editing.
     * 
     * POST /api/sessions/me/editing
     */
    async setEditingEntity(
        req: ValidatedParamsT<Record<string, never>, SetEditingEntityRequest>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const body = req.body as SetEditingEntityRequest;
            const { entityType, entityId } = body;

            await this.userSessionService.setEditingEntity(userId, entityType, entityId);

            res.json({ success: true });
        } catch (error) {
            console.error('Error setting editing entity:', error);
            res.status(500).json({ error: 'Failed to set editing entity' });
        }
    }

    /**
     * Clears the entity the user is editing.
     * 
     * DELETE /api/sessions/me/editing?entityType=class&entityId=1
     * Or DELETE /api/sessions/me/editing to clear all editing entities
     */
    async clearEditingEntity(
        req: ValidatedParamsT<Record<string, never>, Record<string, never>>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            // Check if entityType and entityId are provided as query params
            const entityType = req.query?.entityType as string | undefined;
            const entityIdStr = req.query?.entityId as string | undefined;

            if (entityType && entityIdStr) {
                const entityId = parseInt(entityIdStr, 10);
                if (!isNaN(entityId)) {
                    await this.userSessionService.clearEditingEntity(userId, entityType, entityId);
                } else {
                    res.status(400).json({ error: 'Invalid entity ID' });
                    return;
                }
            } else {
                // Clear all editing entities by getting session and clearing editing array
                const session = await this.userSessionService.getUserSession(userId);
                if (session && session.editing.length > 0) {
                    // Clear all editing entities one by one
                    for (const entity of session.editing) {
                        await this.userSessionService.clearEditingEntity(userId, entity.entityType, entity.entityId);
                    }
                }
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Error clearing editing entity:', error);
            res.status(500).json({ error: 'Failed to clear editing entity' });
        }
    }
}

// Export singleton instance
export const userSessionController = new UserSessionController();
