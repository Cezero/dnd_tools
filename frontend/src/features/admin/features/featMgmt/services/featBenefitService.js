import api from '@/services/api';

export const fetchFeatBenefits = async (searchParams) => {
    try {
        const response = await api(`/feats/benefits?${searchParams.toString()}`);
        const benefits = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : benefits.length;
        return { data: benefits, total: total };
    } catch (error) {
        console.error('Error fetching feat benefits:', error);
        throw error;
    }
};

export const fetchFeatBenefitById = async (id) => {
    try {
        const response = await api(`/feats/benefits/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching feat benefit with ID ${id}:`, error);
        throw error;
    }
};

export const createFeatBenefit = async (benefitData) => {
    try {
        const response = await api('/feats/benefits', { method: 'POST', body: JSON.stringify(benefitData) });
        return response.id;
    } catch (error) {
        console.error('Error creating feat benefit:', error);
        throw error;
    }
};

export const updateFeatBenefit = async (id, benefitData) => {
    try {
        const response = await api(`/feats/benefits/${id}`, { method: 'PUT', body: JSON.stringify(benefitData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating feat benefit with ID ${id}:`, error);
        throw error;
    }
};

export const deleteFeatBenefit = async (id) => {
    try {
        await api(`/feats/benefits/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting feat benefit with ID ${id}:`, error);
        throw error;
    }
}; 