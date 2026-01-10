/**
 * Selective authentication middleware that applies authentication to all routes
 * except explicitly public paths.
 * 
 * This middleware provides a whitelist approach to authentication, where specific
 * paths are marked as public and all others require authentication. This is useful
 * for applications where most routes are protected but a few (like health checks
 * and authentication endpoints) need to be public.
 * 
 * Architecture Decision: Using a whitelist approach (public paths) rather than
 * requiring authentication on each route simplifies route configuration. The
 * middleware is applied globally, and only exceptions are listed.
 * 
 * Usage:
 * This middleware is typically applied globally in the Express app, before
 * individual route registration. Public paths are defined in the publicPaths array.
 * 
 * Source File: `apps/backend/src/middleware/requireAuthExcept.ts`
 */

import { Request, Response, NextFunction } from 'express';
import { match } from 'path-to-regexp';

import { requireAuth } from './authMiddleware';

/**
 * List of public paths that do not require authentication.
 * 
 * Paths are matched using path-to-regexp with exact matching (end: true),
 * ensuring only the exact paths listed are public.
 */
const publicPaths = [
    '/health',
    '/api/auth/login',
    '/api/auth/register'
];

/**
 * Selective authentication middleware.
 * 
 * Checks if the request path matches any public path. If it does, the request
 * proceeds without authentication. Otherwise, authentication is required.
 * 
 * Architecture Decision: Using path-to-regexp for path matching provides flexibility
 * for future path patterns while maintaining exact matching for security.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * 
 * @example
 * ```typescript
 * // Apply globally
 * app.use(RequireAuthExcept);
 * 
 * // All routes except /health, /api/auth/login, /api/auth/register require auth
 * ```
 */
export function RequireAuthExcept(req: Request, res: Response, next: NextFunction) {
    const isPublic = publicPaths.some((path) => match(path, { end: true })(req.path));
    if (isPublic) return next();
    return requireAuth(req, res, next);
} 
