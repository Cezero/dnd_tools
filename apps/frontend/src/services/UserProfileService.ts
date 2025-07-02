import {
    UserProfileResponseSchema,
    UserProfileUpdateResponseSchema,
    UpdateUserProfileSchema,
} from '@shared/schema';

import { typedApi } from './Api';

const USER_PROFILE_API_BASE_URL = '/user/profile';

export const UserProfileService = {
    getUserProfile: typedApi<undefined, typeof UserProfileResponseSchema>({
        path: USER_PROFILE_API_BASE_URL,
        method: 'GET',
        responseSchema: UserProfileResponseSchema,
    }),

    updateUserProfile: typedApi<typeof UpdateUserProfileSchema, typeof UserProfileUpdateResponseSchema>({
        path: USER_PROFILE_API_BASE_URL,
        method: 'PUT',
        requestSchema: UpdateUserProfileSchema,
        responseSchema: UserProfileUpdateResponseSchema,
    }),
};
