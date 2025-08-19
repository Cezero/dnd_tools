import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { PrismaClient } from '@shared/prisma-client';
import { AuthServiceResult, JwtPayload, LoginUserRequest, RegisterUserRequest, UserProfile, AuthUser, UserWithDiceConfig } from '@shared/schema';

import type { AuthService } from './types';
import { config } from '../../config';

const prisma = new PrismaClient();

// UPDATED: Transform user data to include dice config (for profile responses)
function transformUserWithDiceConfig(user: UserWithDiceConfig): UserProfile {
    return {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin,
        email: user.email,
        preferredEditionId: user.preferredEditionId,
        diceConfig: user.diceConfigBaseRef ? {
            baseConfigId: user.diceConfigBaseRef.id,
            baseConfigName: user.diceConfigBaseRef.name,
            overrides: user.diceConfigOverrides
        } : null
    };
}

// Helper function to transform user data for JWT (minimal authentication data only)
function transformUserForJwt(user: AuthUser): Omit<JwtPayload, 'iat' | 'exp'> {
    return {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
    };
}

export const authService: AuthService = {
    async registerUser(data: RegisterUserRequest): Promise<AuthServiceResult> {
        try {
            // Check if user already exists
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

            // Hash password
            const hashedPassword = await bcrypt.hash(data.password, 10);

            // Create user
            const user = await prisma.user.create({
                data: {
                    username: data.username,
                    email: data.email,
                    password: hashedPassword,
                    isAdmin: false
                },
                include: {
                    diceConfigBaseRef: true,
                    diceConfigOverrides: true
                }
            });

            // Transform Prisma fields to expected schema format
            const userWithDiceConfig = transformUserWithDiceConfig(user);
            const userForJwt = transformUserForJwt(user);

            const token = jwt.sign(
                {
                    ...userForJwt
                },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            return {
                success: true,
                error: null,
                token,
                user: userWithDiceConfig
            };
        } catch (err) {
            console.error('Registration error:', err);
            return { success: false, error: 'Server error', token: null, user: null };
        }
    },

    async loginUser(data: LoginUserRequest): Promise<AuthServiceResult> {
        try {
            const user = await prisma.user.findFirst({
                where: { username: data.username },
                include: {
                    diceConfigBaseRef: true,
                    diceConfigOverrides: true
                }
            });
            if (!user) {
                return { success: false, error: 'Invalid credentials', token: null, user: null };
            }

            const match = await bcrypt.compare(data.password, user.password);
            if (!match) {
                return { success: false, error: 'Invalid credentials', token: null, user: null };
            }

            // Transform Prisma fields to expected schema format
            const userWithDiceConfig = transformUserWithDiceConfig(user);
            const userForJwt = transformUserForJwt(user);

            const token = jwt.sign(
                {
                    ...userForJwt
                },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            return {
                success: true,
                error: null,
                token,
                user: userWithDiceConfig
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
                    email: true, // ADD: Include email field
                    isAdmin: true,
                    preferredEditionId: true,
                    diceConfigBaseRef: true,
                    diceConfigOverrides: true
                }
            });

            if (!user) {
                return { success: false, error: 'User not found', token: null, user: null };
            }

            // Transform Prisma fields to expected schema format
            const userWithDiceConfig = transformUserWithDiceConfig(user);

            return {
                success: true,
                error: null,
                token: null,
                user: userWithDiceConfig
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
                    email: true, // ADD: Include email field
                    isAdmin: true,
                    preferredEditionId: true,
                    diceConfigBaseRef: true,
                    diceConfigOverrides: true
                }
            });

            if (!user) {
                return { success: false, error: 'User not found for token refresh', token: null, user: null };
            }

            // Transform Prisma fields to expected schema format
            const userWithDiceConfig = transformUserWithDiceConfig(user);
            const userForJwt = transformUserForJwt(user);

            // Generate a new token with a refreshed expiration and updated preferred_edition_id
            const newToken = jwt.sign(
                {
                    ...userForJwt
                },
                config.jwt.secret,
                { expiresIn: config.jwt.expiresIn }
            );

            return { success: true, error: null, token: newToken, user: userWithDiceConfig };
        } catch (err) {
            console.error('Token refresh error:', err);
            return { success: false, error: 'Invalid or expired token', token: null, user: null };
        }
    }
}; 
