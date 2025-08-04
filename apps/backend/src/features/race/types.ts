import {
    UpdateRaceRequest,
    CreateRaceRequest,
    RaceIdParamRequest,
    GetAllRacesResponse,
    GetRaceResponse,
    UpdateResponse,
    CreateResponse,
} from '@shared/schema';

// Service interface
export interface RaceService {
    getAllRaces: () => Promise<GetAllRacesResponse>;
    getRaceById: (id: RaceIdParamRequest) => Promise<GetRaceResponse | null>;
    createRace: (data: CreateRaceRequest) => Promise<CreateResponse>;
    updateRace: (id: RaceIdParamRequest, data: UpdateRaceRequest) => Promise<UpdateResponse>;
    deleteRace: (id: RaceIdParamRequest) => Promise<UpdateResponse>;
}
