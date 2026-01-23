import { buildValidatedRouter } from '@/lib/buildValidatedRouter.js';
import { DraftRefRequestSchema } from '@shared/schema';

import {
    GetAllSessions,
    GetAllEntityStates,
    GetAllLocks,
    GetAllWebSocketSubscriptions,
    ForceReleaseLock,
} from './AdminSessionMonitoringController';
import { requireAdmin } from '../../../middleware/authMiddleware.js';

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
 * - POST /api/admin/locks/force-release - Force release a lock (draftType and id in body)
 * 
 * @see AdminSessionMonitoringController - For endpoint implementations
 */
const { router: AdminSessionMonitoringRouter, get, post } = buildValidatedRouter();

// Get all user sessions
get('/sessions', requireAdmin, {}, GetAllSessions);

// Get all entity states
get('/entity-states', requireAdmin, {}, GetAllEntityStates);

// Get all locks
get('/locks', requireAdmin, {}, GetAllLocks);

// Get all WebSocket subscriptions
get('/websocket-subscriptions', requireAdmin, {}, GetAllWebSocketSubscriptions);

// Force release a lock
post('/locks/force-release', requireAdmin, { body: DraftRefRequestSchema }, ForceReleaseLock);

export { AdminSessionMonitoringRouter };
