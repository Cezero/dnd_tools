import { match } from 'path-to-regexp';
import { Request, Response, NextFunction } from 'express';
import { RequireAuth } from './RequireAuth';

const publicPaths = [
    '/health',
    '/api/auth/login',
    '/api/auth/register'
];

export function RequireAuthExcept(req: Request, res: Response, next: NextFunction) {
    const isPublic = publicPaths.some((path) => match(path, { end: true })(req.path));
    if (isPublic) return next();
    return RequireAuth(req, res, next);
} 