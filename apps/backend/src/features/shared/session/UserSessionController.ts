import type { NextFunction, Response } from 'express';

import type { ValidatedBodyT, ValidatedQueryT, ValidatedNoInput } from '@/util/validated-types';
import type { DraftRefRequest, DraftRefQueryOptional, UserSessionResponse } from '@shared/schema';

import { UserSessionService } from './UserSessionService';

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
        req: ValidatedNoInput<UserSessionResponse>,
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
        req: ValidatedBodyT<DraftRefRequest>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { draftType, id } = req.body;

            await this.userSessionService.addViewingEntity(userId, draftType, id);

            res.json({ success: true, draftType, id });
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
        req: ValidatedBodyT<DraftRefRequest>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { draftType, id } = req.body;

            await this.userSessionService.removeViewingEntity(userId, draftType, id);

            res.json({ success: true, draftType, id });
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
        req: ValidatedBodyT<DraftRefRequest>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { draftType, id } = req.body;

            await this.userSessionService.setEditingEntity(userId, draftType, id);

            res.json({ success: true, draftType, id });
        } catch (error) {
            console.error('Error setting editing entity:', error);
            res.status(500).json({ error: 'Failed to set editing entity' });
        }
    }

    /**
     * Clears the entity the user is editing.
     * 
     * DELETE /api/sessions/me/editing?draftType=1&id=1
     * Or DELETE /api/sessions/me/editing to clear all editing entities
     */
    async clearEditingEntity(
        req: ValidatedQueryT<DraftRefQueryOptional>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { draftType, id } = req.query;

            if (draftType !== undefined && id !== undefined) {
                // Clear specific entity
                await this.userSessionService.clearEditingEntity(userId, draftType, id);
                res.json({ success: true, draftType, id });
            } else {
                // Clear all editing entities by getting session and clearing editing array
                const session = await this.userSessionService.getUserSession(userId);
                if (session && session.editing.length > 0) {
                    // Clear all editing entities one by one
                    for (const entity of session.editing) {
                        await this.userSessionService.clearEditingEntity(userId, entity.draftType, entity.id);
                    }
                }
                res.json({ success: true });
            }
        } catch (error) {
            console.error('Error clearing editing entity:', error);
            res.status(500).json({ error: 'Failed to clear editing entity' });
        }
    }
}

// Export singleton instance
export const userSessionController = new UserSessionController();

// Export controller methods for use in routes
export const GetMySession = userSessionController.getMySession.bind(userSessionController);
export const AddViewingEntity = userSessionController.addViewingEntity.bind(userSessionController);
export const RemoveViewingEntity = userSessionController.removeViewingEntity.bind(userSessionController);
export const SetEditingEntity = userSessionController.setEditingEntity.bind(userSessionController);
export const ClearEditingEntity = userSessionController.clearEditingEntity.bind(userSessionController);
