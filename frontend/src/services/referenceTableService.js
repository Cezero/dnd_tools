import api from '@/services/api';

export const fetchReferenceTables = async (searchParams) => {
    try {
        // Build query string from searchParams
        const queryString = new URLSearchParams(searchParams).toString();
        const url = queryString ? `/referencetables?${queryString}` : '/referencetables';
        const response = await api(url, { method: 'GET' });
        return { data: response.results, total: response.total };
    } catch (error) {
        console.error('Error fetching reference tables:', error);
        throw error;
    }
};

export const createReferenceTable = async (tableData) => {
    try {
        const response = await api('/referencetables', { method: 'POST', body: JSON.stringify(tableData) });
        return response;
    } catch (error) {
        console.error('Error creating reference table:', error);
        throw error;
    }
};

export const deleteReferenceTable = async (id) => {
    try {
        const response = await api(`/referencetables/${id}`, { method: 'DELETE' });
        return response;
    } catch (error) {
        console.error(`Error deleting reference table with ID ${id}:`, error);
        throw error;
    }
};

export const getReferenceTable = async (identifier) => {
    try {
        const response = await api(`/referencetables/${identifier}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching reference table with ID ${identifier}:`, error);
        throw error;
    }
};

export const updateReferenceTable = async (id, tableData) => {
    try {
        const response = await api(`/referencetables/${id}`, { method: 'PUT', body: JSON.stringify(tableData) });
        return response;
    } catch (error) {
        console.error(`Error updating reference table with ID ${id}:`, error);
        throw error;
    }
};

export default { fetchReferenceTables, createReferenceTable, deleteReferenceTable, getReferenceTable, updateReferenceTable };