import api from '@/services/api';

export const fetchRaces = async ({ page = 1, limit = 10, filters = {} }) => {
    try {
        const response = await api('/races', { method: 'GET', params: { page, limit, ...filters } });
        const races = Array.isArray(response.data) ? response.data : [];
        const total = response.total !== undefined ? response.total : races.length;
        return { data: races, total: total };
    } catch (error) {
        console.error('Error fetching races:', error);
        throw error;
    }
};

export const fetchRaceById = async (id) => {
    try {
        const response = await api(`/races/${id}`, { method: 'GET' });
        return response.data;
    } catch (error) {
        console.error(`Error fetching race with ID ${id}:`, error);
        throw error;
    }
};

export const createRace = async (raceData) => {
    try {
        const response = await api('/races', { method: 'POST', body: JSON.stringify(raceData) });
        return response.data;
    } catch (error) {
        console.error('Error creating race:', error);
        throw error;
    }
};

export const updateRace = async (id, raceData) => {
    try {
        const response = await api(`/races/${id}`, { method: 'PUT', body: JSON.stringify(raceData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating race with ID ${id}:`, error);
        throw error;
    }
};

export const deleteRace = async (id) => {
    try {
        await api(`/races/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting race with ID ${id}:`, error);
        throw error;
    }
}; 