import api from '@/services/api';

const USER_PROFILE_API_BASE_URL = '/user/profile';

const userProfileService = {
    async getUserProfile() {
        try {
            const response = await api(USER_PROFILE_API_BASE_URL, { method: 'GET' });
            return response.user;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    },

    async updateUserProfile(profileData) {
        try {
            const response = await api(USER_PROFILE_API_BASE_URL, {
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

export default userProfileService; 