import type { Request } from 'express';

import type { Skill } from '@shared/prisma-client';

// Extend Prisma Skill type for query parameters, making all fields optional and string-based
export type SkillQuery = Partial<Record<keyof Skill, string>> & {
    page?: string;
    limit?: string;
    [key: string]: string | undefined;
};

// Use Prisma type directly for skill response
export type SkillResponse = Skill;

export interface SkillListResponse {
    page: number;
    limit: number;
    total: number;
    results: SkillResponse[];
}

// Service interface
export interface SkillService {
    getAllSkills: (query: SkillQuery) => Promise<SkillListResponse>;
    getAllSkillsSimple: () => Promise<Array<{ id: number; name: string }>>;
    getSkillById: (id: number) => Promise<SkillResponse | null>;
    createSkill: (data: import('@shared/prisma-client').Prisma.SkillCreateInput) => Promise<{ id: number; message: string }>;
    updateSkill: (id: number, data: import('@shared/prisma-client').Prisma.SkillUpdateInput) => Promise<{ message: string }>;
    deleteSkill: (id: number) => Promise<{ message: string }>;
} 