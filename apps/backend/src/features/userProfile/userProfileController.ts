import { Request, Response, NextFunction } from 'express';
import type { UpdateUserProfileRequest, UserProfileResponse, UserProfileUpdateResponse } from '@shared/schema';
import { userProfileService } from './userProfileService';

export async function GetUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = req.user?.id;
        if (!id) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }

        const profile: UserProfileResponse | null = await userProfileService.getUserProfile(id);
        if (!profile) {
            res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
            return;
        }

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        next(error);
    }
}

export async function UpdateUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = req.user?.id;
        if (!id) {
            res.status(401).json({
                success: false,
                error: 'User not authenticated'
            });
            return;
        }

        const result: UserProfileUpdateResponse = await userProfileService.updateUserProfile(id, req.body);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        next(error);
    }
} 