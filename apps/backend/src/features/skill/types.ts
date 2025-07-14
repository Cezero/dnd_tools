import { SkillQueryRequest, UpdateSkillRequest, CreateSkillRequest, SkillIdParamRequest, SkillResponse, SkillQueryResponse, CreateResponse, UpdateResponse, GetAllSkillsResponse } from '@shared/schema';

// Service interface
export interface SkillService {
    getSkills: (query: SkillQueryRequest) => Promise<SkillQueryResponse>;
    getAllSkills: () => Promise<GetAllSkillsResponse>;
    getSkillById: (id: SkillIdParamRequest) => Promise<SkillResponse | null>;
    createSkill: (data: CreateSkillRequest) => Promise<CreateResponse>;
    updateSkill: (id: SkillIdParamRequest, data: UpdateSkillRequest) => Promise<UpdateResponse>;
    deleteSkill: (id: SkillIdParamRequest) => Promise<UpdateResponse>;
} 
