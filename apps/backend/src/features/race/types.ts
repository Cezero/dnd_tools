import {
    RaceTraitQueryRequest,
    UpdateRaceRequest,
    RaceQueryRequest,
    CreateRaceRequest,
    RaceResponse,
    UpdateRaceTraitRequest,
    CreateRaceTraitRequest,
    RaceTraitResponse,
    RaceIdParamRequest,
    RaceTraitSlugParamRequest,
    RaceQueryResponse,
    RaceTraitQueryResponse,
    RaceTraitGetAllResponse
} from '@shared/schema';

// Service interface
export interface RaceService {
    getRaces: (query: RaceQueryRequest) => Promise<RaceQueryResponse>;
    getRaceById: (id: RaceIdParamRequest) => Promise<RaceResponse | null>;
    createRace: (data: CreateRaceRequest) => Promise<{ id: number; message: string }>;
    updateRace: (id: RaceIdParamRequest, data: UpdateRaceRequest) => Promise<{ message: string }>;
    deleteRace: (id: RaceIdParamRequest) => Promise<{ message: string }>;
    getRaceTraits: (query: RaceTraitQueryRequest) => Promise<RaceTraitQueryResponse>;
    getRaceTraitsList: () => Promise<RaceTraitGetAllResponse>;
    getRaceTraitBySlug: (slug: RaceTraitSlugParamRequest) => Promise<RaceTraitResponse | null>;
    createRaceTrait: (data: CreateRaceTraitRequest) => Promise<{ slug: string; message: string }>;
    updateRaceTrait: (slug: RaceTraitSlugParamRequest, data: UpdateRaceTraitRequest) => Promise<{ message: string }>;
    deleteRaceTrait: (slug: RaceTraitSlugParamRequest) => Promise<{ message: string }>;
}
