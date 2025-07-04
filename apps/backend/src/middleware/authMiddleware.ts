import { Request, Response, NextFunction } from 'express';

import { ForbiddenError } from '@/errors/ForbiddenError';
import { UnauthorizedError } from '@/errors/UnauthorizedError';
import { authService } from '@/features/auth/authService';
import type { AuthUser } from '@shared/schema';

import { AuthOptions } from './types';

// Extend Express Request interface to include user property
declare module 'express' {
    interface Request {
        user?: AuthUser;
    }
}

/**
 * Unified authentication and authorization middleware
 * @param options - Configuration for auth requirements
 * @returns Express middleware function
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
 * Convenience middleware for routes that require authentication only
 */
export const requireAuth = createAuthMiddleware({ requireAuth: true, requireAdmin: false });

/**
 * Convenience middleware for routes that require admin access
 */
export const requireAdmin = createAuthMiddleware({ requireAuth: true, requireAdmin: true });

/**
 * Convenience middleware for routes that require authentication but admin is optional
 */
export const requireAuthOptionalAdmin = createAuthMiddleware({ requireAuth: true, requireAdmin: false }); 