import { Api } from '@/services/Api';

export const FetchClasses = async (searchParams) => {
    try {
        const response = await Api(`/classes?${searchParams.toString()}`);
        const classes = Array.isArray(response.results) ? response.results : [];
        const total = response.total !== undefined ? response.total : classes.length;
        return { data: classes, total: total };
    } catch (error) {
        console.error('Error fetching classes:', error);
        throw error;
    }
};

export const FetchClassById = async (id) => {
    try {
        const response = await Api(`/classes/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching class with ID ${id}:`, error);
        throw error;
    }
};

export const CreateClass = async (classData) => {
    try {
        const response = await Api('/classes', { method: 'POST', body: JSON.stringify(classData) });
        return response.data;
    } catch (error) {
        console.error('Error creating class:', error);
        throw error;
    }
};

export const UpdateClass = async (id, classData) => {
    try {
        const response = await Api(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(classData) });
        return response.data;
    } catch (error) {
        console.error(`Error updating class with ID ${id}:`, error);
        throw error;
    }
};

export const DeleteClass = async (id) => {
    try {
        await Api(`/classes/${id}`, { method: 'DELETE' });
    } catch (error) {
        console.error(`Error deleting class with ID ${id}:`, error);
        throw error;
    }
};
