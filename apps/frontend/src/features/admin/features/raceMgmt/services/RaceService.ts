import { Api } from '@/services/Api';

export const FetchRaces = async (searchParams: URLSearchParams): Promise<{ data: any[]; total: number }> => {
    try {
        const response = await Api(`/races?${searchParams.toString()}`);
        const races = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : races.length;
        return { data: races, total: total };
    } catch (error) {
        console.error('Error fetching races:', error);
        throw error;
    }
};

export const FetchRaceById = async (id: string): Promise<any> => {
    try {
        const response = await Api(`/races/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching race with ID ${id}:`, error);
        throw error;
    }
};

export const CreateRace = async (raceData: any): Promise<any> => {
    try {
        const response = await Api('/races', { method: 'POST', body: JSON.stringify(raceData) });
        return response.data;
    } catch (error) {
        console.error('Error creating race:', error);
        throw error;
    }
};

export const UpdateRace = async (id: string, raceData: any): Promise<any> => {
    try {
        const response = await Api(`/races/${id}`, { method: 'PUT', body: JSON.stringify(raceData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating race with ID ${id}:`, error);
        throw error;
    }
};

export const DeleteRace = async (id: number): Promise<void> => {
    try {
        await Api(`/races/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting race with ID ${id}:`, error);
        throw error;
    }
};
