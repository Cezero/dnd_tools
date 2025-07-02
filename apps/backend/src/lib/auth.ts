import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { config } from '@/config';

export interface JwtPayload {
    id: number;
    username: string;
    is_admin: boolean;
    preferred_edition_id: number | null;
}

export function verifyToken(token: string): JwtPayload | null {
    try {
        return jwt.verify(token, config.jwt.secret) as JwtPayload;
    } catch (_error) {
        return null;
    }
}

export function generateToken(payload: Omit<JwtPayload, 'id'> & { id: number }): string {
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

export async function HashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function ComparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}
