import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userProfileService } from './userProfileService';
import { PrismaClient } from '@shared/prisma-client';
import jwt from 'jsonwebtoken';

// Mock Prisma client
vi.mock('@shared/prisma-client', () => {
    const mPrisma = {
        user: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
    };
    return { PrismaClient: vi.fn(() => mPrisma) };
});

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn(() => 'mocked.jwt.token'),
    },
    sign: vi.fn(() => 'mocked.jwt.token'),
}));

describe('userProfileService', () => {
    const prisma = new PrismaClient() as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getUserProfile', () => {
        it('returns user profile if user exists', async () => {
            prisma.user.findUnique.mockResolvedValue({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword',
                isAdmin: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                preferredEditionId: 2,
            });
            const result = await userProfileService.getUserProfile(1);
            expect(result).toEqual({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                isAdmin: false,
                preferredEditionId: 2,
                is_admin: false,
                preferred_edition_id: 2,
            });
        });

        it('returns null if user does not exist', async () => {
            prisma.user.findUnique.mockResolvedValue(null);
            const result = await userProfileService.getUserProfile(999);
            expect(result).toBeNull();
        });
    });

    describe('updateUserProfile', () => {
        it('updates and returns user profile and token', async () => {
            prisma.user.update.mockResolvedValue({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpassword',
                isAdmin: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                preferredEditionId: 3,
            });
            const result = await userProfileService.updateUserProfile(1, { preferredEditionId: 3 });
            expect(result).toEqual({
                message: 'User profile updated successfully',
                user: {
                    id: 1,
                    username: 'testuser',
                    email: 'test@example.com',
                    isAdmin: true,
                    preferredEditionId: 3,
                    is_admin: true,
                    preferred_edition_id: 3,
                },
                token: 'mocked.jwt.token',
            });
        });
    });
}); 