import type { Skill } from '@shared/prisma-client/client';

export interface SkillQuery {
    page?: string;
    limit?: string;
    name?: string;
    abilityId?: string;
    trainedOnly?: string;
    affectedByArmor?: string;
}

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

// Use Prisma type directly for skill response
export type SkillResponse = Skill;

export interface SkillListResponse {
    page: number;
    limit: number;
    total: number;
    results: SkillResponse[];
} 