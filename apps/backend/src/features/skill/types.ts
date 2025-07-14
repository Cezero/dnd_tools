import { UpdateSkillRequest, CreateSkillRequest, SkillIdParamRequest, GetSkillResponse, CreateResponse, UpdateResponse, GetAllSkillsResponse } from '@shared/schema';

export interface SkillService {
    getAllSkills: () => Promise<GetAllSkillsResponse>;
    getSkillById: (id: SkillIdParamRequest) => Promise<GetSkillResponse | null>;
    createSkill: (data: CreateSkillRequest) => Promise<CreateResponse>;
    updateSkill: (id: SkillIdParamRequest, data: UpdateSkillRequest) => Promise<UpdateResponse>;
    deleteSkill: (id: SkillIdParamRequest) => Promise<UpdateResponse>;
} 
