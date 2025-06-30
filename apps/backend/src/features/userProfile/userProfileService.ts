import jwt from 'jsonwebtoken';
import { PrismaClient } from '@shared/prisma-client';
import type { UpdateUserProfileRequest, UserProfileResponse, UserProfileUpdateResponse } from '@shared/schema';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_dev_secret';

export interface UserProfileService {
    getUserProfile: (userId: number) => Promise<UserProfileResponse | null>;
    updateUserProfile: (userId: number, data: UpdateUserProfileRequest) => Promise<UserProfileUpdateResponse>;
}

export const userProfileService: UserProfileService = {
    async getUserProfile(userId: number): Promise<UserProfileResponse | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                isAdmin: true,
                preferredEditionId: true
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
                preferredEditionId: true
            }
        });

        const newToken = jwt.sign(
            {
                id: updatedUser.id,
                username: updatedUser.username,
                is_admin: updatedUser.isAdmin,
                preferred_edition_id: updatedUser.preferredEditionId
            },
            JWT_SECRET,
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
    }
}; 