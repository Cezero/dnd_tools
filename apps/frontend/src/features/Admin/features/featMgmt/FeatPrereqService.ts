import { Api } from '@/services/Api';

export const FetchFeatPrereqs = async (searchParams) => {
    try {
        const response = await Api(`/feats/prereqs?${searchParams.toString()}`);
        const prereqs = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : prereqs.length;
        return { data: prereqs, total: total };
    } catch (error) {
        console.error('Error fetching feat prerequisites:', error);
        throw error;
    }
};

export const FetchFeatPrereqById = async (id) => {
    try {
        const response = await Api(`/feats/prereqs/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching feat prerequisite with ID ${id}:`, error);
        throw error;
    }
};

export const CreateFeatPrereq = async (prereqData) => {
    try {
        const response = await Api('/feats/prereqs', { method: 'POST', body: JSON.stringify(prereqData) });
        return response.id;
    } catch (error) {
        console.error('Error creating feat prerequisite:', error);
        throw error;
    }
};

export const UpdateFeatPrereq = async (id, prereqData) => {
    try {
        const response = await Api(`/feats/prereqs/${id}`, { method: 'PUT', body: JSON.stringify(prereqData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating feat prerequisite with ID ${id}:`, error);
        throw error;
    }
};

export const DeleteFeatPrereq = async (id) => {
    try {
        await Api(`/feats/prereqs/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting feat prerequisite with ID ${id}:`, error);
        throw error;
    }
};
