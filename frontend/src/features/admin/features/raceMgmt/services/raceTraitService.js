import api from '@/services/api';

export const fetchRaceTraits = async (searchParams) => {
    try {
        const response = await api(`/races/traits?${searchParams.toString()}`);
        const traits = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : traits.length;
        return { data: traits, total: total };
    } catch (error) {
        console.error('Error fetching race traits:', error);
        throw error;
    }
};

export const fetchRaceTraitById = async (id) => {
    try {
        const response = await api(`/races/traits/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching race trait with ID ${id}:`, error);
        throw error;
    }
};

export const createRaceTrait = async (traitData) => {
    try {
        const response = await api('/races/traits', { method: 'POST', body: JSON.stringify(traitData) });
        return response.data;
    } catch (error) {
        console.error('Error creating race trait:', error);
        throw error;
    }
};

export const updateRaceTrait = async (id, traitData) => {
    try {
        const response = await api(`/races/traits/${id}`, { method: 'PUT', body: JSON.stringify(traitData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating race trait with ID ${id}:`, error);
        throw error;
    }
};

export const deleteRaceTrait = async (id) => {
    try {
        await api(`/races/traits/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting race trait with ID ${id}:`, error);
        throw error;
    }
}; 