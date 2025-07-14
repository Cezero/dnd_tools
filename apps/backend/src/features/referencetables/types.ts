import { ReferenceTableDataResponse, ReferenceTableSummary, ReferenceTableUpdate, ReferenceTableSlugParamRequest, GetAllReferenceTablesResponse } from '@shared/schema';

export interface ReferenceTableService {
    getAllReferenceTables: () => Promise<GetAllReferenceTablesResponse>;
    getReferenceTableData: (identifier: ReferenceTableSlugParamRequest) => Promise<ReferenceTableDataResponse | null>;
    createReferenceTable: (data: ReferenceTableUpdate) => Promise<{ id: string; message: string }>;
    updateReferenceTable: (identifier: ReferenceTableSlugParamRequest, data: ReferenceTableUpdate) => Promise<{ message: string }>;
    deleteReferenceTable: (identifier: ReferenceTableSlugParamRequest) => Promise<{ message: string }>;
    getReferenceTableSummary: (identifier: ReferenceTableSlugParamRequest) => Promise<ReferenceTableSummary | null>;
} 
