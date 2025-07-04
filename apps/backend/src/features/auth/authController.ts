import { Response } from 'express';

import { ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types'
import { LoginUserRequest, RegisterUserRequest, AuthServiceResult } from '@shared/schema';

import { authService } from './authService';

// Register
export async function RegisterUser(req: ValidatedBodyT<RegisterUserRequest>, res: Response) {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        res.status(400).json({ error: 'Missing fields' });
        return;
    }

    const result = await authService.registerUser({ username, email, password });

    if (!result.success) {
        res.status(409).json(result);
        return;
    }

    res.status(201).json(result);
}

// Login
export async function LoginUser(req: ValidatedBodyT<LoginUserRequest>, res: Response) {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: 'Missing credentials' });
        return;
    }

    const result = await authService.loginUser({ username, password });

    if (!result.success) {
        res.status(401).json(result);
        return;
    }

    res.json(result);
}

// Get User from Token
export async function GetUserFromToken(req: ValidatedNoInput<AuthServiceResult>, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.getUserFromToken(token);

    if (!result.success) {
        res.status(403).json(result);
        return;
    }

    res.json(result);
}

// Refresh Token
export async function RefreshToken(req: ValidatedNoInput<AuthServiceResult>, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    const result = await authService.refreshToken(token);

    if (!result.success) {
        res.status(403).json(result);
        return;
    }

    res.json(result);
}