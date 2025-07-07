import {
    RaceTraitQueryRequest,
    UpdateRaceRequest,
    RaceQueryRequest,
    CreateRaceRequest,
    UpdateRaceTraitRequest,
    CreateRaceTraitRequest,
    RaceIdParamRequest,
    RaceTraitSlugParamRequest,
    RaceQueryResponse,
    RaceTraitQueryResponse,
    RaceTraitGetAllResponse,
    GetRaceResponse,
    GetRaceTraitResponse,
    UpdateResponse,
    CreateResponse
} from '@shared/schema';

// Service interface
export interface RaceService {
    getRaces: (query: RaceQueryRequest) => Promise<RaceQueryResponse>;
    getRaceById: (id: RaceIdParamRequest) => Promise<GetRaceResponse | null>;
    createRace: (data: CreateRaceRequest) => Promise<CreateResponse>;
    updateRace: (id: RaceIdParamRequest, data: UpdateRaceRequest) => Promise<UpdateResponse>;
    deleteRace: (id: RaceIdParamRequest) => Promise<UpdateResponse>;
    getRaceTraits: (query: RaceTraitQueryRequest) => Promise<RaceTraitQueryResponse>;
    getRaceTraitsList: () => Promise<RaceTraitGetAllResponse>;
    getRaceTraitBySlug: (slug: RaceTraitSlugParamRequest) => Promise<GetRaceTraitResponse | null>;
    createRaceTrait: (data: CreateRaceTraitRequest) => Promise<CreateResponse>;
    updateRaceTrait: (slug: RaceTraitSlugParamRequest, data: UpdateRaceTraitRequest) => Promise<UpdateResponse>;
    deleteRaceTrait: (slug: RaceTraitSlugParamRequest) => Promise<UpdateResponse>;
}
