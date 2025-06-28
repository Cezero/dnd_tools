import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Extend Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: {
                user_id: number;
                username: string;
                is_admin: boolean;
                iat: number;
                exp: number;
            };
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_dev_secret';

export function RequireAuth(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid auth header' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET) as {
            user_id: number;
            username: string;
            is_admin: boolean;
            iat: number;
            exp: number;
        };
        req.user = payload;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
} 