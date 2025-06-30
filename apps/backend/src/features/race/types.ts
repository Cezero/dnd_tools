import type { Request } from 'express';

import type {
    Race,
    RaceTrait,
    RaceLanguageMap,
    RaceAbilityAdjustment,
    RaceTraitMap,
    Prisma
} from '@shared/prisma-client';

// Extend Prisma Race type for query parameters, making all fields optional and string-based
export type RaceQuery = Partial<Record<keyof Race, string>> & {
    page?: string;
    limit?: string;
    [key: string]: string | undefined;
};

// Request interfaces extending Express Request
export interface RaceRequest extends Request {
    query: RaceQuery;
}

export interface RaceCreateRequest extends Request {
    body: Prisma.RaceCreateInput;
}

export interface RaceUpdateRequest extends Request {
    params: { id: string };
    body: Prisma.RaceUpdateInput;
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

// Request interfaces for RaceTrait
export interface RaceTraitRequest extends Request {
    query: RaceTraitQuery;
}

export interface RaceTraitCreateRequest extends Request {
    body: Prisma.RaceTraitCreateInput;
}

export interface RaceTraitUpdateRequest extends Request {
    params: { slug: string };
    body: Prisma.RaceTraitUpdateInput;
}

export interface RaceTraitDeleteRequest extends Request {
    params: { slug: string };
}

// Service interface
export interface RaceService {
    getAllRaces: (query: RaceQuery) => Promise<RaceListResponse>;
    getAllRacesSimple: () => Promise<Array<{ id: number; name: string }>>;
    getRaceById: (id: number) => Promise<RaceWithRelations | null>;
    createRace: (data: Prisma.RaceCreateInput) => Promise<{ id: number; message: string }>;
    updateRace: (id: number, data: Prisma.RaceUpdateInput) => Promise<{ message: string }>;
    deleteRace: (id: number) => Promise<{ message: string }>;
    getAllRaceTraits: (query: RaceTraitQuery) => Promise<{
        page: number;
        limit: number;
        total: number;
        results: any[];
    }>;
    getAllRaceTraitsSimple: () => Promise<Array<{
        slug: string;
        name: string | null;
        description: string | null;
        hasValue: boolean;
    }>>;
    getRaceTraitBySlug: (slug: string) => Promise<RaceTrait | null>;
    createRaceTrait: (data: Prisma.RaceTraitCreateInput) => Promise<{ slug: string; message: string }>;
    updateRaceTrait: (slug: string, data: Prisma.RaceTraitUpdateInput) => Promise<{ message: string }>;
    deleteRaceTrait: (slug: string) => Promise<{ message: string }>;
    validateRaceData: (data: Prisma.RaceCreateInput | Prisma.RaceUpdateInput) => string | null;
    validateRaceTraitData: (data: Prisma.RaceTraitCreateInput) => string | null;
} 