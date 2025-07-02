import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT } from '@/util/validated-types'
import type { UpdateUserProfileRequest, UserProfileIdParamRequest, UserProfileResponse, UserProfileUpdateResponse } from '@shared/schema';

import { userProfileService } from './userProfileService';

export async function GetUserProfile(req: ValidatedParamsT<UserProfileIdParamRequest, UserProfileResponse>, res: Response) {
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
}

export async function UpdateUserProfile(req: ValidatedParamsBodyT<UserProfileIdParamRequest, UpdateUserProfileRequest, UserProfileUpdateResponse>, res: Response) {
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
} 