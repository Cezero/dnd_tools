import {
    UpdateRaceRequest,
    CreateRaceRequest,
    RaceIdParamRequest,
    GetAllRacesResponse,
    Race,
    UpdateResponse,
    CreateResponse,
    RaceCacheResponse,
} from '@shared/schema';

// Service interface
export interface RaceService {
    getAllRaces: () => Promise<GetAllRacesResponse>;
    getRaceById: (id: RaceIdParamRequest, characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>) => Promise<Race | null>;
    createRace: (data: CreateRaceRequest) => Promise<CreateResponse>;
    updateRace: (id: RaceIdParamRequest, data: UpdateRaceRequest) => Promise<UpdateResponse>;
    deleteRace: (id: RaceIdParamRequest) => Promise<UpdateResponse>;
    getRaceCache: () => Promise<RaceCacheResponse>;
}
