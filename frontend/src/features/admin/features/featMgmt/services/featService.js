import api from '@/services/api';

export const fetchFeats = async (searchParams) => {
    try {
        const response = await api(`/feats?${searchParams.toString()}`);
        const feats = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : feats.length;
        return { data: feats, total: total };
    } catch (error) {
        console.error('Error fetching feats:', error);
        throw error;
    }
};

export const fetchFeatById = async (id) => {
    try {
        const response = await api(`/feats/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching feat with ID ${id}:`, error);
        throw error;
    }
};

export const createFeat = async (featData) => {
    try {
        const response = await api('/feats', { method: 'POST', body: JSON.stringify(featData) });
        return response.id;
    } catch (error) {
        console.error('Error creating feat:', error);
        throw error;
    }
};

export const updateFeat = async (id, featData) => {
    try {
        const response = await api(`/feats/${id}`, { method: 'PUT', body: JSON.stringify(featData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating feat with ID ${id}:`, error);
        throw error;
    }
};

export const deleteFeat = async (id) => {
    try {
        await api(`/feats/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting feat with ID ${id}:`, error);
        throw error;
    }
}; 