import { Api } from '@/services/Api';

export const FetchRaceTraits = async (searchParams: URLSearchParams): Promise<{ data: any[]; total: number }> => {
    try {
        const response = await Api(`/races/traits?${searchParams.toString()}`);
        const traits = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : traits.length;
        return { data: traits, total: total };
    } catch (error) {
        console.error('Error fetching race traits:', error);
        throw error;
    }
};

export const FetchRaceTraitBySlug = async (slug: string): Promise<any> => {
    try {
        const response = await Api(`/races/traits/${slug}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching race trait with SLUG ${slug}:`, error);
        throw error;
    }
};

export const CreateRaceTrait = async (traitData: any): Promise<any> => {
    try {
        const response = await Api('/races/traits', { method: 'POST', body: JSON.stringify(traitData) });
        return response.data;
    } catch (error) {
        console.error('Error creating race trait:', error);
        throw error;
    }
};

export const UpdateRaceTrait = async (slug: string, traitData: any): Promise<any> => {
    try {
        const response = await Api(`/races/traits/${slug}`, { method: 'PUT', body: JSON.stringify(traitData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating race trait with ID ${slug}:`, error);
        throw error;
    }
};

export const DeleteRaceTrait = async (slug: string): Promise<void> => {
    try {
        await Api(`/races/traits/${slug}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting race trait with ID ${slug}:`, error);
        throw error;
    }
};
