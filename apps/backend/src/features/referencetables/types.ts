import type { Request } from 'express';

import type { ReferenceTable, ReferenceTableColumn, ReferenceTableCell } from '@shared/prisma-client';
import type {
    CreateReferenceTableRequest,
    UpdateReferenceTableRequest
} from '@shared/schema';

// Extend Prisma ReferenceTable type for query parameters, making all fields optional and string-based
export type ReferenceTableQuery = Partial<Record<keyof ReferenceTable, string>> & {
    page?: string;
    limit?: string;
    sort?: string;
    order?: string;
    [key: string]: string | undefined;
};

// Request interfaces extending Express Request
export interface ReferenceTableRequest extends Request {
    query: ReferenceTableQuery;
}

export interface ReferenceTableCreateRequest extends Request {
    body: CreateReferenceTableRequest;
}

export interface ReferenceTableUpdateRequest extends Request {
    params: { id: string };
    body: UpdateReferenceTableRequest;
}

export interface ReferenceTableDeleteRequest extends Request {
    params: { id: string };
}

export interface ReferenceTableGetRequest extends Request {
    params: { identifier: string };
}

// Use Prisma types for reference table with relationships
export interface ReferenceTableData {
    table: ReferenceTable;
    headers: Array<ReferenceTableColumn>;
    rows: Array<{
        id: number;
        rowIndex: number;
        label: string | null;
        cells: (ReferenceTableCell | null)[];
    }>;
}

// Use Prisma types directly for the list response
export interface ReferenceTableListResponse {
    page: number;
    limit: number;
    total: number;
    results: Array<ReferenceTable & {
        _count: {
            rows: number;
            columns: number;
        };
    }>;
}

// Service interface
export interface ReferenceTableService {
    getAllReferenceTables: (query: {
        page?: string;
        limit?: string;
        sort?: string;
        order?: string;
        name?: string;
        slug?: string;
    }) => Promise<ReferenceTableListResponse>;
    getReferenceTableData: (identifier: string | number) => Promise<ReferenceTableData | null>;
    createReferenceTable: (data: import('@shared/prisma-client').Prisma.ReferenceTableCreateInput) => Promise<{ id: string; message: string }>;
    updateReferenceTable: (slug: string, data: import('@shared/prisma-client').Prisma.ReferenceTableUpdateInput) => Promise<{ message: string }>;
    deleteReferenceTable: (slug: string) => Promise<{ message: string }>;
    resolve: (identifiers: string[]) => Promise<ReferenceTableData[]>;
} 