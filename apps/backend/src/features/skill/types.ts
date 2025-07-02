import { SkillQueryRequest, UpdateSkillRequest, CreateSkillRequest, SkillIdParamRequest, SkillResponse, SkillQueryResponse } from '@shared/schema';

// Service interface
export interface SkillService {
    getSkills: (query: SkillQueryRequest) => Promise<SkillQueryResponse>;
    getSkillById: (id: SkillIdParamRequest) => Promise<SkillResponse | null>;
    createSkill: (data: CreateSkillRequest) => Promise<{ id: number; message: string }>;
    updateSkill: (id: SkillIdParamRequest, data: UpdateSkillRequest) => Promise<{ message: string }>;
    deleteSkill: (id: SkillIdParamRequest) => Promise<{ message: string }>;
} 