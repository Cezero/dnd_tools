import { Request, Response } from 'express';
import { authService } from './authService';

// Register
export async function RegisterUser(req: Request, res: Response) {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    const result = await authService.registerUser({ username, email, password });

    if (!result.success) {
        return res.status(409).json({ error: result.error });
    }

    return res.status(201).json({ message: 'User created' });
}

// Login
export async function LoginUser(req: Request, res: Response) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    const result = await authService.loginUser({ username, password });

    if (!result.success) {
        return res.status(401).json({ error: result.error });
    }

    return res.json({
        token: result.token,
        user: result.user
    });
}

// Get User from Token
export async function GetUserFromToken(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.getUserFromToken(token);

    if (!result.success) {
        return res.status(403).json({ error: result.error });
    }

    return res.json({ user: result.user });
}

// Refresh Token
export async function RefreshToken(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.refreshToken(token);

    if (!result.success) {
        return res.status(403).json({ error: result.error });
    }

    return res.json({ token: result.newToken });
} 