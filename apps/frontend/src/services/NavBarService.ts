import { UserProfileService } from './UserProfileService';
import type { UpdateUserProfileRequest } from '@shared/schema';

export const NavBarService = {
    updatePreferredEdition: async (editionId: number) => {
        const requestData: UpdateUserProfileRequest = {
            preferredEditionId: editionId
        };
        return await UserProfileService.updateUserProfile(requestData);
    },
}; 