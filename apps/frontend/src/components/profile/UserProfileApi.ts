import { typedApi } from '@/services/Api';
import {
    UserProfileResponseSchema,
    UserProfileUpdateResponseSchema,
    UpdateUserProfileSchema,
} from '@shared/schema';

const USER_PROFILE_API_BASE_URL = '/user/profile';

export const UserProfileApi = {
    getUserProfile: typedApi({
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
