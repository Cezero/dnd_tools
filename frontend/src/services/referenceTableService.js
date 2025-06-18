import api from '@/services/api';

export const fetchReferenceTables = async (searchParams) => {
    try {
        // Build query string from searchParams
        const queryString = new URLSearchParams(searchParams).toString();
        const url = queryString ? `/reference-tables?${queryString}` : '/reference-tables';
        const response = await api(url, { method: 'GET' });
        return { data: response.results, total: response.total };
    } catch (error) {
        console.error('Error fetching reference tables:', error);
        throw error;
    }
};

export const createReferenceTable = async (tableData) => {
    try {
        const response = await api('/reference-tables', { method: 'POST', body: JSON.stringify(tableData) });
        return response;
    } catch (error) {
        console.error('Error creating reference table:', error);
        throw error;
    }
};

export const deleteReferenceTable = async (id) => {
    try {
        const response = await api(`/reference-tables/${id}`, { method: 'DELETE' });
        return response;
    } catch (error) {
        console.error(`Error deleting reference table with ID ${id}:`, error);
        throw error;
    }
};

export const getReferenceTableById = async (id) => {
    try {
        const response = await api(`/reference-tables/${id}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching reference table with ID ${id}:`, error);
        throw error;
    }
};

export const fetchReferenceTableRaw = async (id) => {
    try {
        const url = `/reference-tables/${id}/raw`;
        const response = await api(url, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching raw data for reference table with ID ${id}:`, error);
        throw error;
    }
};

export default { fetchReferenceTables, createReferenceTable, deleteReferenceTable, getReferenceTableById, fetchReferenceTableRaw };