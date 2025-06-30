import type { Request } from 'express';

import type { Feat, FeatBenefitMap, FeatPrerequisiteMap } from '@shared/prisma-client';
// Extend Prisma Feat type for query parameters, making all fields optional and string-based
export type FeatQuery = Partial<Record<keyof Feat, string>> & {
    page?: string;
    limit?: string;
    [key: string]: string | undefined;
};

// Type for creating benefit/prerequisite entries (without featId since it's set by the service)
export type FeatBenefitCreateData = Omit<FeatBenefitMap, 'featId'>;
export type FeatPrerequisiteCreateData = Omit<FeatPrerequisiteMap, 'featId'>;

// Use Prisma types for create/update operations
export type FeatCreateData = Pick<Feat, 'name' | 'typeId'> &
    Partial<Pick<Feat, 'description' | 'benefit' | 'normalEffect' | 'specialEffect' | 'prerequisites' | 'repeatable' | 'fighterBonus'>> & {
        benefits?: FeatBenefitCreateData[];
        prereqs?: FeatPrerequisiteCreateData[];
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

// Service interface
export interface FeatService {
    getAllFeats: (query: FeatQuery) => Promise<FeatListResponse>;
    getAllFeatsSimple: () => Promise<Array<{ id: number; name: string }>>;
    getFeatById: (id: number) => Promise<FeatWithRelations | null>;
    createFeat: (data: FeatCreateData) => Promise<{ id: number; message: string }>;
    updateFeat: (id: number, data: FeatUpdateData) => Promise<{ message: string }>;
    deleteFeat: (id: number) => Promise<{ message: string }>;
} 