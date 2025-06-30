import type { Class } from '@shared/prisma-client/client';

// Use Prisma types for the base class data
export type ClassData = Pick<Class, 'name' | 'hitDie' | 'abbreviation' | 'isPrestige' | 'canCastSpells' | 'skillPoints' | 'editionId' | 'isVisible'> &
    Partial<Pick<Class, 'description' | 'castingAbilityId'>>;

export interface ClassQuery {
    page?: string;
    limit?: string;
    sort?: string;
    order?: string;
    name?: string;
    editionId?: string;
}

// Use Prisma type directly for class response
export type ClassResponse = Class;

export interface ClassListResponse {
    page: number;
    limit: number;
    total: number;
    results: ClassResponse[];
} 