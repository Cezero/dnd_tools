import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { PrismaClient } from '@shared/prisma-client';

import type { LoginUserRequest, RegisterUserRequest, JwtPayload, AuthServiceResult } from './types';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_dev_secret';

export interface AuthService {
    registerUser: (data: RegisterUserRequest) => Promise<AuthServiceResult>;
    loginUser: (data: LoginUserRequest) => Promise<AuthServiceResult>;
    getUserFromToken: (token: string) => Promise<AuthServiceResult>;
    refreshToken: (token: string) => Promise<AuthServiceResult>;
}

export const authService: AuthService = {
    async registerUser({ username, email, password }) {
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
                return { success: false, error: 'Username or email already exists' };
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

            return { success: true };
        } catch (err) {
            console.error('Registration error:', err);
            return { success: false, error: 'Server error' };
        }
    },

    async loginUser({ username, password }) {
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
                return { success: false, error: 'Invalid credentials' };
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return { success: false, error: 'Invalid credentials' };
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

            return {
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    isAdmin: user.isAdmin,
                    preferredEditionId: user.preferredEditionId,
                    is_admin: user.isAdmin,
                    preferred_edition_id: user.preferredEditionId
                }
            };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: 'Server error' };
        }
    },

    async getUserFromToken(token: string) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

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
                return { success: false, error: 'User not found' };
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.username,
                    isAdmin: user.isAdmin,
                    preferredEditionId: user.preferredEditionId,
                    is_admin: user.isAdmin,
                    preferred_edition_id: user.preferredEditionId
                }
            };
        } catch (err) {
            console.error('Token verification error:', err);
            return { success: false, error: 'Invalid or expired token' };
        }
    },

    async refreshToken(token: string) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

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
                return { success: false, error: 'User not found for token refresh' };
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

            return { success: true, newToken };
        } catch (err) {
            console.error('Token refresh error:', err);
            return { success: false, error: 'Invalid or expired token' };
        }
    }
}; 