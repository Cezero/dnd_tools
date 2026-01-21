import { Router } from 'express';

import { requireAdmin } from '../../../middleware/authMiddleware';
import { adminSessionMonitoringController } from './AdminSessionMonitoringController';

/**
 * Router for admin session monitoring endpoints.
 * 
 * All routes require authentication and admin privileges.
 * 
 * Routes:
 * - GET /api/admin/sessions - Get all user sessions
 * - GET /api/admin/entity-states - Get all entity states
 * - GET /api/admin/locks - Get all entity locks
 * - GET /api/admin/websocket-subscriptions - Get all WebSocket subscriptions
 * - POST /api/admin/locks/:entityType/:entityId/force-release - Force release a lock
 * 
 * @see AdminSessionMonitoringController - For endpoint implementations
 */
export const AdminSessionMonitoringRouter = Router();

// All routes require admin authentication
AdminSessionMonitoringRouter.use(requireAdmin);

// Get all user sessions
AdminSessionMonitoringRouter.get('/sessions', (req, res, next) => {
    adminSessionMonitoringController.getAllSessions(req as any, res, next);
});

// Get all entity states
AdminSessionMonitoringRouter.get('/entity-states', (req, res, next) => {
    adminSessionMonitoringController.getAllEntityStates(req as any, res, next);
});

// Get all locks
AdminSessionMonitoringRouter.get('/locks', (req, res, next) => {
    adminSessionMonitoringController.getAllLocks(req as any, res, next);
});

// Get all WebSocket subscriptions
AdminSessionMonitoringRouter.get('/websocket-subscriptions', (req, res, next) => {
    adminSessionMonitoringController.getAllWebSocketSubscriptions(req as any, res, next);
});

// Force release a lock
AdminSessionMonitoringRouter.post('/locks/:entityType/:entityId/force-release', (req, res, next) => {
    adminSessionMonitoringController.forceReleaseLock(req as any, res, next);
});
