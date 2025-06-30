import { Request, Response, NextFunction } from 'express';
import { authService } from '../features/auth/authService';
import type { AuthUser } from '../features/auth/types';

// Extend Express Request interface to include user property
declare module 'express' {
    interface Request {
        user?: AuthUser;
    }
}

export interface AuthOptions {
    requireAuth?: boolean;
    requireAdmin?: boolean;
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
            return res.status(401).json({ error: 'Missing or invalid auth header' });
        }

        const token = authHeader.split(' ')[1];
        const result = await authService.getUserFromToken(token);

        if (!result.success) {
            return res.status(403).json({ error: result.error || 'Invalid or expired token' });
        }

        req.user = result.user!;

        // Check admin requirement if specified
        if (requireAdmin && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
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