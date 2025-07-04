import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { PrismaClient } from '@shared/prisma-client';
import { AuthServiceResult, JwtPayload, LoginUserRequest, RegisterUserRequest } from '@shared/schema';

import type { AuthService } from './types';
import { config } from '../../config';

const prisma = new PrismaClient();

export const authService: AuthService = {
    async registerUser(data: RegisterUserRequest): Promise<AuthServiceResult> {
        try {
            // Check for existing user
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: data.username },
                        { email: data.email }
                    ]
                }
            });

            if (existingUser) {
                return { success: false, error: 'Username or email already exists', token: null, user: null };
            }

            const hash = await bcrypt.hash(data.password, 12);

            // Create new user
            await prisma.user.create({
                data: {
                    username: data.username,
                    email: data.email,
                    password: hash
                }
            });

            return { success: true, error: null, token: null, user: null };
        } catch (err) {
            console.error('Registration error:', err);
            return { success: false, error: 'Server error', token: null, user: null };
        }
    },

    async loginUser(data: LoginUserRequest): Promise<AuthServiceResult> {
        try {
            const user = await prisma.user.findFirst({
                where: { username: data.username },
                select: {
                    id: true,
                    username: true,
                    password: true,
                    isAdmin: true,
                    preferredEditionId: true
                }
            });
            if (!user) {
                return { success: false, error: 'Invalid credentials', token: null, user: null };
            }

            const match = await bcrypt.compare(data.password, user.password);
            if (!match) {
                return { success: false, error: 'Invalid credentials', token: null, user: null };
            }

            const token = jwt.sign(
                {
                    ...user
                },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            return {
                success: true,
                error: null,
                token,
                user: user
            };
        } catch (err) {
            console.error('Login error:', err);
            return { success: false, error: 'Server error', token: null, user: null };
        }
    },

    async getUserFromToken(token: string): Promise<AuthServiceResult> {
        try {
            const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

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
                return { success: false, error: 'User not found', token: null, user: null };
            }

            return {
                success: true,
                error: null,
                token: null,
                user: user
            };
        } catch (err) {
            console.error('Token verification error:', err);
            return { success: false, error: 'Invalid or expired token', token: null, user: null };
        }
    },

    async refreshToken(token: string): Promise<AuthServiceResult> {
        try {
            const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

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
                return { success: false, error: 'User not found for token refresh', token: null, user: null };
            }

            // Generate a new token with a refreshed expiration and updated preferred_edition_id
            const newToken = jwt.sign(
                {
                    ...user
                },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            return { success: true, error: null, token: newToken, user: user };
        } catch (err) {
            console.error('Token refresh error:', err);
            return { success: false, error: 'Invalid or expired token', token: null, user: null };
        }
    }
}; 