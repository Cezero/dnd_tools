import type { NextFunction, Response } from 'express';

import type { ValidatedParamsT } from '@/util/validated-types';
import { AdminSessionMonitoringService } from './AdminSessionMonitoringService';
import { EntityLockService } from '../entityState/EntityLockService';

/**
 * Controller for admin session monitoring endpoints.
 * 
 * Provides endpoints for administrators to monitor:
 * - All active user sessions
 * - All entity states
 * - All entity locks
 * - All WebSocket subscriptions
 * - Force release locks
 * 
 * **Admin Access**: All endpoints require admin authentication.
 * 
 * @see AdminSessionMonitoringService - For monitoring logic
 * @see EntityLockService - For lock management
 * @see packages/shared/docs/application-overview/admin-session-monitoring.md - Full documentation
 */
export class AdminSessionMonitoringController {
    private monitoringService: AdminSessionMonitoringService;
    private lockService: EntityLockService;

    constructor() {
        this.monitoringService = new AdminSessionMonitoringService();
        this.lockService = new EntityLockService();
    }

    /**
     * Gets all active user sessions.
     * 
     * GET /api/admin/sessions
     */
    async getAllSessions(
        req: ValidatedParamsT<Record<string, never>, unknown>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const sessions = await this.monitoringService.getAllUserSessions();
            res.json(sessions);
        } catch (error) {
            console.error('Error getting all sessions:', error);
            res.status(500).json({ error: 'Failed to get sessions' });
        }
    }

    /**
     * Gets all entity states.
     * 
     * GET /api/admin/entity-states
     */
    async getAllEntityStates(
        req: ValidatedParamsT<Record<string, never>, unknown>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const states = await this.monitoringService.getAllEntityStates();
            res.json(states);
        } catch (error) {
            console.error('Error getting all entity states:', error);
            res.status(500).json({ error: 'Failed to get entity states' });
        }
    }

    /**
     * Gets all entity locks.
     * 
     * GET /api/admin/locks
     */
    async getAllLocks(
        req: ValidatedParamsT<Record<string, never>, unknown>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const locks = await this.monitoringService.getAllLocks();
            res.json(locks);
        } catch (error) {
            console.error('Error getting all locks:', error);
            res.status(500).json({ error: 'Failed to get locks' });
        }
    }

    /**
     * Gets all WebSocket subscriptions.
     * 
     * GET /api/admin/websocket-subscriptions
     */
    async getAllWebSocketSubscriptions(
        req: ValidatedParamsT<Record<string, never>, unknown>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const subscriptions = await this.monitoringService.getAllWebSocketSubscriptions();
            res.json(subscriptions);
        } catch (error) {
            console.error('Error getting WebSocket subscriptions:', error);
            res.status(500).json({ error: 'Failed to get WebSocket subscriptions' });
        }
    }

    /**
     * Force releases a lock on an entity.
     * 
     * POST /api/admin/locks/:entityType/:entityId/force-release
     */
    async forceReleaseLock(
        req: ValidatedParamsT<{ entityType: string; entityId: string }, unknown>,
        res: Response,
        _next: NextFunction
    ): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }

            const { entityType, entityId } = req.params;
            const numericEntityId = parseInt(entityId, 10);

            if (isNaN(numericEntityId)) {
                res.status(400).json({ error: 'Invalid entity ID' });
                return;
            }

            await this.lockService.forceReleaseLock(entityType, numericEntityId, userId);

            res.json({ success: true });
        } catch (error) {
            console.error('Error force releasing lock:', error);
            res.status(500).json({ error: 'Failed to force release lock' });
        }
    }
}

// Export singleton instance
export const adminSessionMonitoringController = new AdminSessionMonitoringController();
