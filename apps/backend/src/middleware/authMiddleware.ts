/**
 * Authentication and authorization middleware for Express routes.
 * 
 * This module provides middleware functions for protecting routes with authentication
 * and authorization requirements. It supports:
 * - Optional authentication (public routes)
 * - Required authentication (protected routes)
 * - Admin-only access (authorization)
 * 
 * Architecture Decisions:
 * - Unified middleware: Single createAuthMiddleware function with options provides
 *   flexibility while maintaining consistency
 * - Token-based auth: Uses JWT tokens from Authorization header (Bearer token)
 * - User injection: Authenticated user is attached to req.user for use in handlers
 * - Error handling: Throws appropriate errors (UnauthorizedError, ForbiddenError) that
 *   are caught by error middleware
 * - Type safety: Extends Express Request type to include user property
 * 
 * Usage Pattern:
 * Routes use convenience exports (requireAuth, requireAdmin) or createAuthMiddleware
 * with custom options to protect endpoints.
 * 
 * Source File: `apps/backend/src/middleware/authMiddleware.ts`
 */

import { Request, Response, NextFunction } from 'express';

import { ForbiddenError } from '@/errors/ForbiddenError';
import { UnauthorizedError } from '@/errors/UnauthorizedError';
import { authService } from '@/features/auth/authService';
import type { AuthUser } from '@shared/schema';

import { AuthOptions } from './types';

/**
 * Extends Express Request interface to include authenticated user property.
 * 
 * After successful authentication, the user object is attached to req.user,
 * making it available to all route handlers.
 */
declare module 'express' {
    interface Request {
        user?: AuthUser;
    }
}

/**
 * Creates authentication and authorization middleware with configurable requirements.
 * 
 * This function returns Express middleware that:
 * 1. Optionally validates authentication (if requireAuth is true)
 * 2. Extracts and validates JWT token from Authorization header
 * 3. Loads user data from token
 * 4. Optionally checks admin status (if requireAdmin is true)
 * 5. Attaches user to req.user for use in handlers
 * 
 * Architecture Decision: Using a factory function with options allows for flexible
 * authentication requirements while maintaining a consistent implementation. The
 * convenience exports (requireAuth, requireAdmin) provide common configurations.
 * 
 * @param options - Configuration for authentication and authorization requirements
 * @param options.requireAuth - Whether authentication is required (default: true)
 * @param options.requireAdmin - Whether admin access is required (default: false)
 * @returns Express middleware function
 * 
 * @example
 * ```typescript
 * // Require authentication but not admin
 * const requireAuth = createAuthMiddleware({ requireAuth: true, requireAdmin: false });
 * 
 * // Require both authentication and admin
 * const requireAdmin = createAuthMiddleware({ requireAuth: true, requireAdmin: true });
 * 
 * router.get('/users', requireAuth, GetUsers);
 * router.delete('/users/:id', requireAdmin, DeleteUser);
 * ```
 */
export function createAuthMiddleware(options: AuthOptions = {}) {
    const { requireAuth = true, requireAdmin = false } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
        // If no auth required, skip
        if (!requireAuth) {
            return next();
        }

        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or invalid auth header');
        }

        const token = authHeader.split(' ')[1];
        const result = await authService.getUserFromToken(token);

        if (!result.success) {
            throw new ForbiddenError(result.error || 'Invalid or expired token');
        }

        req.user = result.user!;

        // Check admin requirement if specified
        if (requireAdmin && !req.user.isAdmin) {
            throw new ForbiddenError('Admin access required');
        }

        next();
    };
}

/**
 * Convenience middleware for routes that require authentication only.
 * 
 * Use this middleware for protected routes that any authenticated user can access.
 * The authenticated user will be available as req.user in the route handler.
 * 
 * @example
 * ```typescript
 * router.get('/profile', requireAuth, GetUserProfile);
 * ```
 */
export const requireAuth = createAuthMiddleware({ requireAuth: true, requireAdmin: false });

/**
 * Convenience middleware for routes that require admin access.
 * 
 * Use this middleware for routes that require both authentication and admin privileges.
 * Non-admin users will receive a 403 Forbidden error.
 * 
 * @example
 * ```typescript
 * router.delete('/users/:id', requireAdmin, DeleteUser);
 * ```
 */
export const requireAdmin = createAuthMiddleware({ requireAuth: true, requireAdmin: true });

/**
 * Convenience middleware for routes that require authentication but admin is optional.
 * 
 * This is functionally equivalent to requireAuth but provided for semantic clarity
 * when admin status might be checked manually in the handler.
 * 
 * @example
 * ```typescript
 * router.get('/admin/stats', requireAuthOptionalAdmin, GetStats);
 * // Handler can check req.user.isAdmin manually
 * ```
 */
export const requireAuthOptionalAdmin = createAuthMiddleware({ requireAuth: true, requireAdmin: false }); 
