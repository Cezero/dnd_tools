import api from '@/services/api';

export const fetchClasses = async (searchParams) => {
    try {
        const response = await api(`/classes?${searchParams.toString()}`);
        const classes = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : classes.length;
        return { data: classes, total: total };
    } catch (error) {
        console.error('Error fetching classes:', error);
        throw error;
    }
};

export const fetchClassById = async (id) => {
    try {
        const response = await api(`/classes/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching class with ID ${id}:`, error);
        throw error;
    }
};

export const createClass = async (classData) => {
    try {
        const response = await api('/classes', { method: 'POST', body: JSON.stringify(classData) });
        return response.data;
    } catch (error) {
        console.error('Error creating class:', error);
        throw error;
    }
};

export const updateClass = async (id, classData) => {
    try {
        const response = await api(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(classData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating class with ID ${id}:`, error);
        throw error;
    }
};

export const deleteClass = async (id) => {
    try {
        await api(`/classes/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting class with ID ${id}:`, error);
        throw error;
    }
};
