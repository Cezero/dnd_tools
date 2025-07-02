import { CreateReferenceTableRequest, ReferenceTableDataResponse, ReferenceTableIdentifierRequest, ReferenceTableQueryRequest, ReferenceTableQueryResponse, UpdateReferenceTableRequest } from '@shared/schema';

export interface ReferenceTableService {
    getReferenceTables: (query: ReferenceTableQueryRequest) => Promise<ReferenceTableQueryResponse>;
    getReferenceTableData: (identifier: ReferenceTableIdentifierRequest) => Promise<ReferenceTableDataResponse | null>;
    createReferenceTable: (data: CreateReferenceTableRequest) => Promise<{ id: string; message: string }>;
    updateReferenceTable: (identifier: ReferenceTableIdentifierRequest, data: UpdateReferenceTableRequest) => Promise<{ message: string }>;
    deleteReferenceTable: (identifier: ReferenceTableIdentifierRequest) => Promise<{ message: string }>;
} 