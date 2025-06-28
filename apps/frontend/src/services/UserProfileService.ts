import { Api } from '@/services/Api';

interface UserProfile {
    id: number;
    username: string;
    email: string;
    is_admin: boolean;
    preferred_edition_id?: number;
}

interface UpdateProfileData {
    preferred_edition_id?: number;
    email?: string;
    username?: string;
}

interface UpdateProfileResponse {
    user: UserProfile;
    token: string;
}

const USER_PROFILE_API_BASE_URL = '/user/profile';

export const UserProfileService = {
    async getUserProfile(): Promise<UserProfile> {
        try {
            const response = await Api(USER_PROFILE_API_BASE_URL, { method: 'GET' });
            return response.user;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    async updateUserProfile(profileData: UpdateProfileData): Promise<UpdateProfileResponse> {
        try {
            const response = await Api(USER_PROFILE_API_BASE_URL, {
                method: 'PUT',
                body: JSON.stringify(profileData),
            });
            return response;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    },
}; 