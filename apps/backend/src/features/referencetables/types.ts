import { ReferenceTableDataResponse, ReferenceTableQueryRequest, ReferenceTableQueryResponse, ReferenceTableSummary, ReferenceTableUpdate, ReferenceTableSlugParamRequest } from '@shared/schema';

export interface ReferenceTableService {
    getReferenceTables: (query: ReferenceTableQueryRequest) => Promise<ReferenceTableQueryResponse>;
    getReferenceTableData: (identifier: ReferenceTableSlugParamRequest) => Promise<ReferenceTableDataResponse | null>;
    createReferenceTable: (data: ReferenceTableUpdate) => Promise<{ id: string; message: string }>;
    updateReferenceTable: (identifier: ReferenceTableSlugParamRequest, data: ReferenceTableUpdate) => Promise<{ message: string }>;
    deleteReferenceTable: (identifier: ReferenceTableSlugParamRequest) => Promise<{ message: string }>;
    getReferenceTableSummary: (identifier: ReferenceTableSlugParamRequest) => Promise<ReferenceTableSummary | null>;
} 