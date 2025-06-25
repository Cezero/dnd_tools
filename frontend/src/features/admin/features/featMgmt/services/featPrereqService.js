import api from '@/services/api';

export const fetchFeatPrereqs = async (searchParams) => {
    try {
        const response = await api(`/feats/prereqs?${searchParams.toString()}`);
        const prereqs = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : prereqs.length;
        return { data: prereqs, total: total };
    } catch (error) {
        console.error('Error fetching feat prerequisites:', error);
        throw error;
    }
};

export const fetchFeatPrereqById = async (id) => {
    try {
        const response = await api(`/feats/prereqs/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching feat prerequisite with ID ${id}:`, error);
        throw error;
    }
};

export const createFeatPrereq = async (prereqData) => {
    try {
        const response = await api('/feats/prereqs', { method: 'POST', body: JSON.stringify(prereqData) });
        return response.id;
    } catch (error) {
        console.error('Error creating feat prerequisite:', error);
        throw error;
    }
};

export const updateFeatPrereq = async (id, prereqData) => {
    try {
        const response = await api(`/feats/prereqs/${id}`, { method: 'PUT', body: JSON.stringify(prereqData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating feat prerequisite with ID ${id}:`, error);
        throw error;
    }
};

export const deleteFeatPrereq = async (id) => {
    try {
        await api(`/feats/prereqs/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting feat prerequisite with ID ${id}:`, error);
        throw error;
    }
}; 