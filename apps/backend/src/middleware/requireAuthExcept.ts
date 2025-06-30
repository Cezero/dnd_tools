import { Request, Response, NextFunction } from 'express';
import { match } from 'path-to-regexp';

import { requireAuth } from './authMiddleware';

const publicPaths = [
    '/health',
    '/api/auth/login',
    '/api/auth/register'
];

export function RequireAuthExcept(req: Request, res: Response, next: NextFunction) {
    const isPublic = publicPaths.some((path) => match(path, { end: true })(req.path));
    if (isPublic) return next();
    return requireAuth(req, res, next);
} 