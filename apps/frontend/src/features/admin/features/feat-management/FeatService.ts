import { Api } from '@/services/Api';

export const FetchFeats = async (searchParams: URLSearchParams): Promise<{ data: any[]; total: number }> => {
    try {
        const response = await Api(`/feats?${searchParams.toString()}`);
        const feats = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : feats.length;
        return { data: feats, total: total };
    } catch (error) {
        console.error('Error fetching feats:', error);
        throw error;
    }
};

export const FetchFeatById = async (id: string): Promise<any> => {
    try {
        const response = await Api(`/feats/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching feat with ID ${id}:`, error);
        throw error;
    }
};

export const CreateFeat = async (featData: any): Promise<number> => {
    try {
        const response = await Api('/feats', { method: 'POST', body: JSON.stringify(featData) });
        return response.id;
    } catch (error) {
        console.error('Error creating feat:', error);
        throw error;
    }
};

export const UpdateFeat = async (id: string, featData: any): Promise<any> => {
    try {
        const response = await Api(`/feats/${id}`, { method: 'PUT', body: JSON.stringify(featData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating feat with ID ${id}:`, error);
        throw error;
    }
};

export const DeleteFeat = async (id: number): Promise<void> => {
    try {
        await Api(`/feats/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting feat with ID ${id}:`, error);
        throw error;
    }
};
