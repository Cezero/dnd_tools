import type { Response, NextFunction } from 'express';

import { ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types';
import type { DraftRefRequest } from '@shared/schema';
import { DraftRefRequestSchema } from '@shared/schema';

import { AdminSessionMonitoringService } from './AdminSessionMonitoringService';
import { DraftLockService } from '../draftState/DraftLockService';


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
 * @see DraftLockService - For lock management
 * @see packages/shared/docs/application-overview/admin-session-monitoring.md - Full documentation
 */
export class AdminSessionMonitoringController {
    private monitoringService: AdminSessionMonitoringService;
    private lockService: DraftLockService;

    constructor() {
        this.monitoringService = new AdminSessionMonitoringService();
        this.lockService = new DraftLockService();
    }

    /**
     * Gets all active user sessions.
     * 
     * GET /api/admin/sessions
     */
    async getAllSessions(
        req: ValidatedNoInput<unknown>,
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
        req: ValidatedNoInput<unknown>,
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
        req: ValidatedNoInput<unknown>,
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
        req: ValidatedNoInput<unknown>,
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
     * Force releases a lock on a draft.
     * 
     * POST /api/admin/locks/force-release
     * 
     * **Type Safety Note**: 
     * - Uses `ValidatedBodyT` from `@/util/validated-types` for proper type safety with `buildValidatedRouter`
     * - NEVER manually type `Request<>` - always use validated types from `@/util/validated-types`
     * - The body type `DraftRefRequest` comes from `@shared/schema` and matches `DraftRefRequestSchema`
     */
    async forceReleaseLock(
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

            await this.lockService.forceReleaseLock(draftType, id, userId);

            res.json({ success: true, draftType, id });
        } catch (error) {
            console.error('Error force releasing lock:', error);
            res.status(500).json({ error: 'Failed to force release lock' });
        }
    }
}

// Export singleton instance
export const adminSessionMonitoringController = new AdminSessionMonitoringController();

// Export controller methods for use in routes
export const GetAllSessions = adminSessionMonitoringController.getAllSessions.bind(adminSessionMonitoringController);
export const GetAllEntityStates = adminSessionMonitoringController.getAllEntityStates.bind(adminSessionMonitoringController);
export const GetAllLocks = adminSessionMonitoringController.getAllLocks.bind(adminSessionMonitoringController);
export const GetAllWebSocketSubscriptions = adminSessionMonitoringController.getAllWebSocketSubscriptions.bind(adminSessionMonitoringController);
export const ForceReleaseLock = adminSessionMonitoringController.forceReleaseLock.bind(adminSessionMonitoringController);
