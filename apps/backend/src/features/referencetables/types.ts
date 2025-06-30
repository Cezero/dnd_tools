import type { Request } from 'express';

import type { ReferenceTable, ReferenceTableColumn, ReferenceTableCell } from '@shared/prisma-client';

// Extend Prisma ReferenceTable type for query parameters, making all fields optional and string-based
export type ReferenceTableQuery = Partial<Record<keyof ReferenceTable, string>> & {
    page?: string;
    limit?: string;
    sort?: string;
    order?: string;
    [key: string]: string | undefined;
};

// Use Prisma types for create/update operations
export type ReferenceTableCreateData = Pick<ReferenceTable, 'name' | 'slug'> &
    Partial<Pick<ReferenceTable, 'description'>> & {
        columns: Array<{
            columnIndex: number;
            header: string;
            span?: number | null;
            alignment?: string | null;
        }>;
        rows: Array<{
            rowIndex: number;
            label?: string | null;
            cells: Array<{
                columnIndex: number;
                value?: string | null;
                colSpan?: number | null;
                rowSpan?: number | null;
            }>;
        }>;
    };

export type ReferenceTableUpdateData = ReferenceTableCreateData;

// Request interfaces extending Express Request
export interface ReferenceTableRequest extends Request {
    query: ReferenceTableQuery;
}

export interface ReferenceTableCreateRequest extends Request {
    body: ReferenceTableCreateData;
}

export interface ReferenceTableUpdateRequest extends Request {
    params: { id: string };
    body: ReferenceTableUpdateData;
}

export interface ReferenceTableDeleteRequest extends Request {
    params: { id: string };
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