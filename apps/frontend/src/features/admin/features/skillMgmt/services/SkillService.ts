import { Api } from '@/services/Api';

export const FetchSkills = async (searchParams: URLSearchParams): Promise<{ data: any[]; total: number }> => {
    try {
        const response = await Api(`/skills?${searchParams.toString()}`);
        const skills = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : skills.length;
        return { data: skills, total: total };
    } catch (error) {
        console.error('Error fetching skills:', error);
        throw error;
    }
};

export const FetchSkillById = async (id: string): Promise<any> => {
    try {
        const response = await Api(`/skills/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching skill with ID ${id}:`, error);
        throw error;
    }
};

export const CreateSkill = async (skillData: any): Promise<any> => {
    try {
        const response = await Api('/skills', { method: 'POST', body: JSON.stringify(skillData) });
        return response.data;
    } catch (error) {
        console.error('Error creating skill:', error);
        throw error;
    }
};

export const UpdateSkill = async (id: string, skillData: any): Promise<any> => {
    try {
        const response = await Api(`/skills/${id}`, { method: 'PUT', body: JSON.stringify(skillData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating skill with ID ${id}:`, error);
        throw error;
    }
};

export const DeleteSkill = async (id: number): Promise<void> => {
    try {
        await Api(`/skills/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting skill with ID ${id}:`, error);
        throw error;
    }
}; 