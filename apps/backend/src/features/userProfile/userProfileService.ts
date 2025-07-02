import jwt from 'jsonwebtoken';

import { config } from '@/config';
import { PrismaClient } from '@shared/prisma-client';
import type { UpdateUserProfileRequest, UserProfileResponse, UserProfileUpdateResponse } from '@shared/schema';

const prisma = new PrismaClient();

export interface UserProfileService {
    getUserProfile: (userId: number) => Promise<UserProfileResponse | null>;
    updateUserProfile: (userId: number, data: UpdateUserProfileRequest) => Promise<UserProfileUpdateResponse>;
    verifyToken: (token: string) => Promise<{ success: boolean; userId?: number; error?: string }>;
}

export const userProfileService: UserProfileService = {
    async getUserProfile(userId: number): Promise<UserProfileResponse | null> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    isAdmin: true,
                    preferredEditionId: true,
                    createdAt: true,
                    updatedAt: true
                }
            });

            if (!user) {
                return null;
            }

            return {
                id: user.id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
                preferredEditionId: user.preferredEditionId,
                is_admin: user.isAdmin,
                preferred_edition_id: user.preferredEditionId
            };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    },

    async updateUserProfile(userId: number, data: UpdateUserProfileRequest): Promise<UserProfileUpdateResponse> {
        const { preferredEditionId } = data;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                preferredEditionId
            },
            select: {
                id: true,
                username: true,
                email: true,
                isAdmin: true,
                preferredEditionId: true,
                createdAt: true,
                updatedAt: true
            }
        });

        const newToken = jwt.sign(
            {
                id: updatedUser.id,
                username: updatedUser.username,
                is_admin: updatedUser.isAdmin,
                preferred_edition_id: updatedUser.preferredEditionId
            },
            config.jwt.secret,
            { expiresIn: '12h' }
        );

        return {
            message: 'User profile updated successfully',
            user: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                isAdmin: updatedUser.isAdmin,
                preferredEditionId: updatedUser.preferredEditionId,
                is_admin: updatedUser.isAdmin,
                preferred_edition_id: updatedUser.preferredEditionId
            },
            token: newToken
        };
    },

    async verifyToken(token: string) {
        try {
            const decoded = jwt.verify(token, config.jwt.secret) as { id: number };
            return { success: true, userId: decoded.id };
        } catch (_error) {
            return { success: false, error: 'Invalid token' };
        }
    }
};
