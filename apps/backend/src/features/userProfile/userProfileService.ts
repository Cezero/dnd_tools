import jwt from 'jsonwebtoken';

import { config } from '@/config';
import { PrismaClient } from '@shared/prisma-client';
import { DiceBoxService } from '../diceBox/diceBoxService';
import type { UpdateUserProfileRequest, UserProfileResponse, UserProfileUpdateResponse } from '@shared/schema';

const prisma = new PrismaClient();

// UPDATED: Transform user data to include dice config
function transformUserWithDiceConfig(user: any): UserProfileResponse {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        preferredEditionId: user.preferredEditionId,
        diceConfig: user.diceConfigBaseRef ? {
            baseConfigId: user.diceConfigBaseRef.id,
            baseConfigName: user.diceConfigBaseRef.name,
            overrides: user.diceConfigOverrides?.reduce((acc: any, override: any) => {
                acc[override.propertyName] = override.propertyValue;
                return acc;
            }, {}) || {}
        } : null
    };
}

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
                    diceConfigBaseRef: true,
                    diceConfigOverrides: true
                }
            });

            if (!user) return null;

            return transformUserWithDiceConfig(user);
        } catch (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
    },

    async updateUserProfile(userId: number, data: UpdateUserProfileRequest): Promise<UserProfileUpdateResponse> {
        const { preferredEditionId, diceConfig } = data;

        // Prepare update data
        const updateData: any = {};
        if (preferredEditionId !== undefined) {
            updateData.preferredEditionId = preferredEditionId;
        }

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: {
                diceConfigBaseRef: true,
                diceConfigOverrides: true
            }
        });

        // Update dice configuration if provided
        if (diceConfig) {
            await DiceBoxService.updateUserDiceConfig(
                userId,
                diceConfig.baseConfigId,
                diceConfig.overrides || {}
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
