import type { UpdateUserProfileRequest } from '@shared/schema';

import { UserProfileService } from './UserProfileService';

export const NavBarService = {
    updatePreferredEdition: async (editionId: number) => {
        const requestData: UpdateUserProfileRequest = {
            preferredEditionId: editionId
        };
        return await UserProfileService.updateUserProfile(requestData);
    },
}; 