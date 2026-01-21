import { Router } from 'express';

import { requireAuth } from '../../../middleware/authMiddleware';
import { userSessionController } from './UserSessionController';

/**
 * Router for user session management endpoints.
 * 
 * All routes require authentication.
 * 
 * Routes:
 * - GET /api/sessions/me - Get current user's session
 * - POST /api/sessions/me/viewing - Add entity to viewing list
 * - DELETE /api/sessions/me/viewing - Remove entity from viewing list
 * - POST /api/sessions/me/editing - Set editing entity
 * - DELETE /api/sessions/me/editing - Clear editing entity
 * 
 * @see UserSessionController - For endpoint implementations
 */
export const UserSessionRouter = Router();

// All routes require authentication
UserSessionRouter.use(requireAuth);

// Get current user's session
UserSessionRouter.get('/me', (req, res, next) => {
    userSessionController.getMySession(req as any, res, next);
});

// Add entity to viewing list
UserSessionRouter.post('/me/viewing', (req, res, next) => {
    userSessionController.addViewingEntity(req as any, res, next);
});

// Remove entity from viewing list
UserSessionRouter.delete('/me/viewing', (req, res, next) => {
    userSessionController.removeViewingEntity(req as any, res, next);
});

// Set editing entity
UserSessionRouter.post('/me/editing', (req, res, next) => {
    userSessionController.setEditingEntity(req as any, res, next);
});

// Clear editing entity
UserSessionRouter.delete('/me/editing', (req, res, next) => {
    userSessionController.clearEditingEntity(req as any, res, next);
});
