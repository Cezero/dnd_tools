import { Api } from '@/services/Api';
import {
    validateSkillListResponse,
    validateSkillResponse,
    validateCreateSkill,
    validateUpdateSkill,
    type SkillFormData,
    type SkillUpdateData,
    type SkillListResponse,
    type SkillResponse
} from './schema';

interface ApiListResponse {
    results: unknown[];
    total: number;
}

interface ApiDataResponse {
    data: unknown;
}

export const FetchSkills = async (searchParams: URLSearchParams): Promise<SkillListResponse> => {
    try {
        const response = await Api(`/skills?${searchParams.toString()}`);
        return validateSkillListResponse(response);
    } catch (error) {
        console.error('Error fetching skills:', error);
        throw error;
    }
};

export const FetchSkillById = async (id: string): Promise<SkillResponse> => {
    try {
        const response = await Api(`/skills/${id}`, { method: 'GET' });
        return validateSkillResponse(response);
    } catch (error) {
        console.error(`Error fetching skill with ID ${id}:`, error);
        throw error;
    }
};

export const CreateSkill = async (skillData: SkillFormData): Promise<SkillResponse> => {
    try {
        const validatedData = validateCreateSkill(skillData);
        const response = await Api('/skills', { method: 'POST', body: JSON.stringify(validatedData) });
        return validateSkillResponse(response.data);
    } catch (error) {
        console.error('Error creating skill:', error);
        throw error;
    }
};

export const UpdateSkill = async (id: string, skillData: SkillUpdateData): Promise<SkillResponse> => {
    try {
        const validatedData = validateUpdateSkill(skillData);
        const response = await Api(`/skills/${id}`, { method: 'PUT', body: JSON.stringify(validatedData) });
        return validateSkillResponse(response.data);
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