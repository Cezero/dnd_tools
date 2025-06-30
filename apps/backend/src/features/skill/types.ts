import type { Request } from 'express';

import type { Skill } from '@shared/prisma-client';

// Extend Prisma Skill type for query parameters, making all fields optional and string-based
export type SkillQuery = Partial<Record<keyof Skill, string>> & {
    page?: string;
    limit?: string;
    [key: string]: string | undefined;
};

export interface SkillCreateData {
    name: string;
    abilityId: number;
    trainedOnly: boolean;
    affectedByArmor: boolean;
    description?: string;
    checkDescription?: string;
    actionDescription?: string;
    retryTypeId?: number;
    retryDescription?: string;
    specialNotes?: string;
    synergyNotes?: string;
    untrainedNotes?: string;
}

export type SkillUpdateData = SkillCreateData;

// Request interfaces extending Express Request
export interface SkillRequest extends Request {
    query: SkillQuery;
}

export interface SkillCreateRequest extends Request {
    body: SkillCreateData;
}

export interface SkillUpdateRequest extends Request {
    params: { id: string };
    body: SkillUpdateData;
}

export interface SkillDeleteRequest extends Request {
    params: { id: string };
}

// Use Prisma type directly for skill response
export type SkillResponse = Skill;

export interface SkillListResponse {
    page: number;
    limit: number;
    total: number;
    results: SkillResponse[];
} 