import { Request, Response } from 'express';

import type { UpdateUserProfileRequest } from './types';
import { userProfileService } from './userProfileService';

interface UserProfileUpdateRequest extends Request {
    body: UpdateUserProfileRequest;
}

export async function GetUserProfile(req: Request, res: Response): Promise<void> {
    try {
        const id = req.user?.id; // Using standardized AuthUser type
        if (!id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const profile = await userProfileService.getUserProfile(id);
        if (!profile) {
            res.status(404).json({ error: 'User profile not found' });
            return;
        }

        res.json(profile);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
}

export async function UpdateUserProfile(req: UserProfileUpdateRequest, res: Response): Promise<void> {
    try {
        const id = req.user?.id;
        if (!id) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const result = await userProfileService.updateUserProfile(id, req.body);

        res.json(result);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
} 