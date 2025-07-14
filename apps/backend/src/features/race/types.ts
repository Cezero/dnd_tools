import {
    UpdateRaceRequest,
    CreateRaceRequest,
    UpdateRaceTraitRequest,
    CreateRaceTraitRequest,
    RaceIdParamRequest,
    RaceTraitSlugParamRequest,
    GetAllRacesResponse,
    GetRaceResponse,
    GetRaceTraitResponse,
    UpdateResponse,
    CreateResponse,
    GetAllRaceTraitsResponse
} from '@shared/schema';

// Service interface
export interface RaceService {
    getAllRaces: () => Promise<GetAllRacesResponse>;
    getRaceById: (id: RaceIdParamRequest) => Promise<GetRaceResponse | null>;
    createRace: (data: CreateRaceRequest) => Promise<CreateResponse>;
    updateRace: (id: RaceIdParamRequest, data: UpdateRaceRequest) => Promise<UpdateResponse>;
    deleteRace: (id: RaceIdParamRequest) => Promise<UpdateResponse>;
    getRaceTraits: () => Promise<GetAllRaceTraitsResponse>;
    getRaceTraitBySlug: (slug: RaceTraitSlugParamRequest) => Promise<GetRaceTraitResponse | null>;
    createRaceTrait: (data: CreateRaceTraitRequest) => Promise<CreateResponse>;
    updateRaceTrait: (slug: RaceTraitSlugParamRequest, data: UpdateRaceTraitRequest) => Promise<UpdateResponse>;
    deleteRaceTrait: (slug: RaceTraitSlugParamRequest) => Promise<UpdateResponse>;
}
