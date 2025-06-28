import { Api } from '@/services/Api';

export const FetchReferenceTables = async (searchParams: URLSearchParams): Promise<{ data: any[]; total: number }> => {
    try {
        // Build query string from searchParams
        const queryString = new URLSearchParams(searchParams).toString();
        const url = queryString ? `/referencetables?${queryString}` : '/referencetables';
        const response = await Api(url, { method: 'GET' });
        return { data: response.results, total: response.total };
    } catch (error) {
        console.error('Error fetching reference tables:', error);
        throw error;
    }
};

export const CreateReferenceTable = async (tableData: any): Promise<any> => {
    try {
        const response = await Api('/referencetables', { method: 'POST', body: JSON.stringify(tableData) });
        return response;
    } catch (error) {
        console.error('Error creating reference table:', error);
        throw error;
    }
};

export const DeleteReferenceTable = async (id: number): Promise<any> => {
    try {
        const response = await Api(`/referencetables/${id}`, { method: 'DELETE' });
        return response;
    } catch (error) {
        console.error(`Error deleting reference table with ID ${id}:`, error);
        throw error;
    }
};

export const GetReferenceTable = async (identifier: string): Promise<any> => {
    try {
        const response = await Api(`/referencetables/${identifier}`, { method: 'GET' });
        return response;
    } catch (error) {
        console.error(`Error fetching reference table with ID ${identifier}:`, error);
        throw error;
    }
};

export const UpdateReferenceTable = async (id: string, tableData: any): Promise<any> => {
    try {
        const response = await Api(`/referencetables/${id}`, { method: 'PUT', body: JSON.stringify(tableData) });
        return response;
    } catch (error) {
        console.error(`Error updating reference table with ID ${id}:`, error);
        throw error;
    }
};
