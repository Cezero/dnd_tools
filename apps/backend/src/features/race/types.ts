import type { FeatureWithRelations } from '@shared/schema';
import {
    CreateRaceRequest,
    CreateResponse,
    GetAllRacesResponse,
    IdParamRequest,
    Race,
    RaceCacheResponse,
    UpdateRaceRequest,
    UpdateResponse,
} from '@shared/schema';

// Service interface
export interface RaceService {
    createRace: (data: CreateRaceRequest) => Promise<CreateResponse>;
    deleteRace: (id: IdParamRequest) => Promise<UpdateResponse>;
    getRaceById: (id: IdParamRequest, characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>) => Promise<Race | null>;
    getRaceCache: () => Promise<RaceCacheResponse>;
    getRaceFeatures: (id: IdParamRequest, characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>) => Promise<FeatureWithRelations[]>;
    getAllRaces: () => Promise<GetAllRacesResponse>;
    updateRace: (id: IdParamRequest, data: UpdateRaceRequest) => Promise<UpdateResponse>;
}
