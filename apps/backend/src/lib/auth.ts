import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

interface User {
    id: number;
    email: string;
    username: string;
}

interface JWTPayload {
    id: number;
    email: string;
    username: string;
    iat?: number;
    exp?: number;
}

const SECRET = process.env.JWT_SECRET || 'supersecret';

export function GenerateToken(user: User): string {
    return jwt.sign({ id: user.id, email: user.email, username: user.username }, SECRET, { expiresIn: '12h' });
}

export function VerifyToken(token: string): JWTPayload {
    return jwt.verify(token, SECRET) as JWTPayload;
}

export async function HashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function ComparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
} 