import type { Request } from 'express';

import type { Class } from '@shared/prisma-client';

// Use Prisma types for the base class data
export type ClassData = Pick<Class, 'name' | 'hitDie' | 'abbreviation' | 'isPrestige' | 'canCastSpells' | 'skillPoints' | 'editionId' | 'isVisible'> &
    Partial<Pick<Class, 'description' | 'castingAbilityId'>>;

// Extend Prisma Class type for query parameters, making all fields optional and string-based
export type ClassQuery = Partial<Record<keyof Class, string>> & {
    page?: string;
    limit?: string;
    sort?: string;
    order?: string;
    [key: string]: string | undefined;
};

// Request interfaces extending Express Request
export interface ClassRequest extends Request {
    query: ClassQuery;
}

export interface ClassCreateRequest extends Request {
    body: ClassData;
}

export interface ClassUpdateRequest extends Request {
    params: { id: string };
    body: ClassData;
}

export interface ClassDeleteRequest extends Request {
    params: { id: string };
}

// Use Prisma type directly for class response
export type ClassResponse = Class;

export interface ClassListResponse {
    page: number;
    limit: number;
    total: number;
    results: ClassResponse[];
}

// Service interface
export interface ClassService {
    getAllClasses: (query: ClassQuery) => Promise<ClassListResponse>;
    getClassById: (id: number) => Promise<ClassResponse | null>;
    createClass: (data: ClassData) => Promise<{ id: number; message: string }>;
    updateClass: (id: number, data: ClassData) => Promise<{ message: string }>;
    deleteClass: (id: number) => Promise<{ message: string }>;
    validateClassData: (data: ClassData) => string | null;
} 