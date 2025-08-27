import jwt from 'jsonwebtoken';

import { config } from '@/config';
import { PrismaClient } from '@shared/prisma-client';
import { UserProfileResponse, UserProfileUpdateResponse, UpdateUserProfileRequest } from '@shared/schema';

import { DiceBoxService } from '../diceBox/diceBoxService';

const prisma = new PrismaClient();

// No transformation needed - Prisma user object directly matches UserProfile schema

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
                include: {
                    diceConfigOverrides: true
                }
            });

            if (!user) return null;

            return user; // User object directly matches UserProfile schema
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    },

    async updateUserProfile(userId: number, data: UpdateUserProfileRequest): Promise<UserProfileUpdateResponse> {
        const { preferredEditionId, diceConfigBase, diceConfigOverrides } = data;

        // Prepare update data
        const updateData: { preferredEditionId?: number; diceConfigBase?: number } = {};
        if (preferredEditionId !== undefined) {
            updateData.preferredEditionId = preferredEditionId;
        }
        if (diceConfigBase !== undefined) {
            updateData.diceConfigBase = diceConfigBase;
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                diceConfigOverrides: true
            }
        });

        // Update dice configuration overrides if provided
        if (diceConfigOverrides !== undefined) {
            await DiceBoxService.updateUserDiceConfig(
                userId,
                diceConfigBase || updatedUser.diceConfigBase || 1, // Use provided base or existing or default
                diceConfigOverrides
            );
        }

        // Get updated user with dice config
        const userWithDiceConfig = await this.getUserProfile(userId);

        if (!userWithDiceConfig) {
            throw new Error('Failed to retrieve updated user profile');
        }

        // Create JWT token
        const userForJwt = {
            id: updatedUser.id,
            username: updatedUser.username,
            isAdmin: updatedUser.isAdmin
        };

        const newToken = jwt.sign(
            { ...userForJwt },
            config.jwt.secret,
            { expiresIn: '12h' }
        );

        return {
            message: 'User profile updated successfully',
            user: userWithDiceConfig,
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
