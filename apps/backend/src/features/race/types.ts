import type { Race, RaceTrait, RaceLanguageMap, RaceAbilityAdjustment, RaceTraitMap } from '@shared/prisma-client/client';

export interface RaceQuery {
    page?: string;
    limit?: string;
    name?: string;
    editionId?: string;
    isVisible?: string;
    sizeId?: string;
    speed?: string;
    favoredClassId?: string;
}

export interface RaceCreateData {
    name: string;
    description?: string;
    sizeId: number;
    speed: number;
    favoredClassId: number;
    editionId?: number;
    isVisible: boolean;
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
}

export type RaceUpdateData = RaceCreateData;

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

// Race trait types
export interface RaceTraitQuery {
    page?: string;
    limit?: string;
    slug?: string;
    name?: string;
    hasValue?: string;
}

export interface RaceTraitCreateData {
    slug: string;
    name?: string;
    description?: string;
    hasValue: boolean;
}

export interface RaceTraitUpdateData {
    name?: string;
    description?: string;
    hasValue: boolean;
} 