import api from '@/services/api';

export const fetchSkills = async (searchParams) => {
    try {
        const response = await api(`/skills?${searchParams.toString()}`);
        const skills = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : skills.length;
        return { data: skills, total: total };
    } catch (error) {
        console.error('Error fetching skills:', error);
        throw error;
    }
};

export const fetchSkillById = async (id) => {
    try {
        const response = await api(`/skills/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching skill with ID ${id}:`, error);
        throw error;
    }
};

export const createSkill = async (skillData) => {
    try {
        const response = await api('/skills', { method: 'POST', body: JSON.stringify(skillData) });
        return response.data;
    } catch (error) {
        console.error('Error creating skill:', error);
        throw error;
    }
};

export const updateSkill = async (id, skillData) => {
    try {
        const response = await api(`/skills/${id}`, { method: 'PUT', body: JSON.stringify(skillData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating skill with ID ${id}:`, error);
        throw error;
    }
};

export const deleteSkill = async (id) => {
    try {
        await api(`/skills/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting skill with ID ${id}:`, error);
        throw error;
    }
}; 