import type { Request } from 'express';

import type { Feat, FeatBenefitMap, FeatPrerequisiteMap } from '@shared/prisma-client';
// Extend Prisma Feat type for query parameters, making all fields optional and string-based
export type FeatQuery = Partial<Record<keyof Feat, string>> & {
    page?: string;
    limit?: string;
    [key: string]: string | undefined;
};

// Use Prisma types for create/update operations
export type FeatCreateData = Pick<Feat, 'name' | 'typeId'> &
    Partial<Pick<Feat, 'description' | 'benefit' | 'normalEffect' | 'specialEffect' | 'prerequisites' | 'repeatable' | 'fighterBonus'>> & {
        benefits?: Array<{
            index: number;
            typeId: number;
            referenceId?: number;
            amount?: number;
        }>;
        prereqs?: Array<{
            index: number;
            typeId: number;
            referenceId?: number;
            amount?: number;
        }>;
    };

export type FeatUpdateData = FeatCreateData;

// Request interfaces extending Express Request
export interface FeatRequest extends Request {
    query: FeatQuery;
}

export interface FeatCreateRequest extends Request {
    body: FeatCreateData;
}

export interface FeatUpdateRequest extends Request {
    params: { id: string };
    body: FeatUpdateData;
}

export interface FeatDeleteRequest extends Request {
    params: { id: string };
}

// Use Prisma types for feat with relationships
export type FeatWithRelations = Feat & {
    benefits: FeatBenefitMap[];
    prerequisitesMap: FeatPrerequisiteMap[];
};

export interface FeatListResponse {
    page: number;
    limit: number;
    total: number;
    results: FeatWithRelations[];
} 