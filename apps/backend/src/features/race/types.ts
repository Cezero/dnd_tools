import type { Request } from 'express';

import type { Race, RaceTrait, RaceLanguageMap, RaceAbilityAdjustment, RaceTraitMap } from '@shared/prisma-client';

// Extend Prisma Race type for query parameters, making all fields optional and string-based
export type RaceQuery = Partial<Record<keyof Race, string>> & {
    page?: string;
    limit?: string;
    [key: string]: string | undefined;
};

// Use Prisma types for create/update operations
export type RaceCreateData = Pick<Race, 'name' | 'sizeId' | 'speed' | 'favoredClassId' | 'isVisible'> &
    Partial<Pick<Race, 'description' | 'editionId'>> & {
        languages?: Array<{
            languageId: number;
            isAutomatic: boolean;
        }>;
        adjustments?: Array<{
            abilityId: number;
            value: number;
        }>;
        traits?: Array<{
            traitId: string;
            value?: string;
        }>;
    };

export type RaceUpdateData = RaceCreateData;

// Request interfaces extending Express Request
export interface RaceRequest extends Request {
    query: RaceQuery;
}

export interface RaceCreateRequest extends Request {
    body: RaceCreateData;
}

export interface RaceUpdateRequest extends Request {
    params: { id: string };
    body: RaceUpdateData;
}

export interface RaceDeleteRequest extends Request {
    params: { id: string };
}

// Use Prisma types for race with relationships
export type RaceWithRelations = Race & {
    languages: RaceLanguageMap[];
    abilityAdjustments: RaceAbilityAdjustment[];
    traits: Array<RaceTraitMap & {
        trait: RaceTrait;
    }>;
};

export interface RaceListResponse {
    page: number;
    limit: number;
    total: number;
    results: Race[];
}

// Extend Prisma RaceTrait type for query parameters
export type RaceTraitQuery = Partial<Record<keyof RaceTrait, string>> & {
    page?: string;
    limit?: string;
    [key: string]: string | undefined;
};

// Use Prisma types for race trait create/update operations
export type RaceTraitCreateData = Pick<RaceTrait, 'slug' | 'hasValue'> &
    Partial<Pick<RaceTrait, 'name' | 'description'>>;

export type RaceTraitUpdateData = Partial<Pick<RaceTrait, 'name' | 'description' | 'hasValue'>>;

// Request interfaces for RaceTrait
export interface RaceTraitRequest extends Request {
    query: RaceTraitQuery;
}

export interface RaceTraitCreateRequest extends Request {
    body: RaceTraitCreateData;
}

export interface RaceTraitUpdateRequest extends Request {
    params: { slug: string };
    body: RaceTraitUpdateData;
}

export interface RaceTraitDeleteRequest extends Request {
    params: { slug: string };
} 