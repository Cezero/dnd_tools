import { Request, Response, NextFunction } from 'express';

export function RequireAdmin(req: Request, res: Response, next: NextFunction) {
    // Assuming requireAuth has already run and populated req.user
    if (!req.user || !req.user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
} 