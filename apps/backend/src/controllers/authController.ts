import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_dev_secret';

interface LoginRequest {
    username: string;
    password: string;
}

interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

interface JWTPayload {
    id: number;
    username: string;
    is_admin: boolean;
    preferred_edition_id: number | null;
    iat?: number;
    exp?: number;
}

// Register
export async function RegisterUser(req: Request<{}, {}, RegisterRequest>, res: Response) {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    try {
        // Check for existing user
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username },
                    { email }
                ]
            }
        });

        if (existingUser) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        const hash = await bcrypt.hash(password, 12);

        // Create new user
        await prisma.user.create({
            data: {
                username,
                email,
                password: hash
            }
        });

        return res.status(201).json({ message: 'User created' });
    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}

// Login
export async function LoginUser(req: Request<{}, {}, LoginRequest>, res: Response) {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }

    try {
        const user = await prisma.user.findFirst({
            where: { username },
            select: {
                id: true,
                username: true,
                password: true,
                isAdmin: true,
                preferredEditionId: true
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                is_admin: user.isAdmin,
                preferred_edition_id: user.preferredEditionId
            },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        return res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                is_admin: user.isAdmin,
                preferred_edition_id: user.preferredEditionId
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}

// Get User from Token
export async function GetUserFromToken(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

        // Fetch user from DB to ensure current preferred_edition_id and other up-to-date info
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                username: true,
                isAdmin: true,
                preferredEditionId: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.json({
            user: {
                id: user.id,
                username: user.username,
                is_admin: user.isAdmin,
                preferred_edition_id: user.preferredEditionId
            }
        });
    } catch (err) {
        console.error('Token verification error:', err);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
}

// Refresh Token
export async function RefreshToken(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

        // Fetch user from DB to get current preferred_edition_id for new token
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                username: true,
                isAdmin: true,
                preferredEditionId: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found for token refresh' });
        }

        // Generate a new token with a refreshed expiration and updated preferred_edition_id
        const newToken = jwt.sign(
            {
                id: user.id,
                username: user.username,
                is_admin: user.isAdmin,
                preferred_edition_id: user.preferredEditionId
            },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        return res.json({ token: newToken });
    } catch (err) {
        console.error('Token refresh error:', err);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
} 