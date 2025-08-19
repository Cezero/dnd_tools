import { Response } from 'express';

import { ValidatedNoInput, ValidatedBodyT } from '@/util/validated-types';
import type { UpdateUserProfileRequest, UserProfileResponse, UserProfileUpdateResponse } from '@shared/schema';

import { userProfileService } from './userProfileService';

export async function GetUserProfile(req: ValidatedNoInput, res: Response) {
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

    res.json(profile);
}

export async function UpdateUserProfile(req: ValidatedBodyT<UpdateUserProfileRequest>, res: Response) {
    const id = req.user?.id;
    if (!id) {
        res.status(401).json({
            success: false,
            error: 'User not authenticated'
        });
        return;
    }

    const result: UserProfileUpdateResponse = await userProfileService.updateUserProfile(id, req.body);

    res.json(result);
} 
