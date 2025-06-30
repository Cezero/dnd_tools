import { Api } from '@/services/Api';

export const FetchFeatBenefits = async (searchParams) => {
    try {
        const response = await Api(`/feats/benefits?${searchParams.toString()}`);
        const benefits = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : benefits.length;
        return { data: benefits, total: total };
    } catch (error) {
        console.error('Error fetching feat benefits:', error);
        throw error;
    }
};

export const FetchFeatBenefitById = async (id) => {
    try {
        const response = await Api(`/feats/benefits/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching feat benefit with ID ${id}:`, error);
        throw error;
    }
};

export const CreateFeatBenefit = async (benefitData) => {
    try {
        const response = await Api('/feats/benefits', { method: 'POST', body: JSON.stringify(benefitData) });
        return response.id;
    } catch (error) {
        console.error('Error creating feat benefit:', error);
        throw error;
    }
};

export const UpdateFeatBenefit = async (id, benefitData) => {
    try {
        const response = await Api(`/feats/benefits/${id}`, { method: 'PUT', body: JSON.stringify(benefitData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating feat benefit with ID ${id}:`, error);
        throw error;
    }
};

export const DeleteFeatBenefit = async (id) => {
    try {
        await Api(`/feats/benefits/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting feat benefit with ID ${id}:`, error);
        throw error;
    }
};
