import { Response } from 'express';

import {
    ValidatedParamsT,
    ValidatedParamsBodyT,
    ValidatedBodyT,
    ValidatedNoInput
} from '@/util/validated-types'
import {
    GetRaceResponse,
    RaceIdParamRequest,
    CreateRaceRequest,
    UpdateRaceRequest,
    GetAllRacesResponse,
    UpdateResponse,
    CreateResponse,
} from '@shared/schema';

import { raceService } from './raceService';
/**
 * Fetches all races from the database with pagination and filtering.
 */
export async function GetAllRaces(req: ValidatedNoInput<GetAllRacesResponse>, res: Response) {
    const races = await raceService.getAllRaces();
    res.json(races);
}

/**
 * Fetches a single race by its ID.
 */
export async function GetRaceById(req: ValidatedParamsT<RaceIdParamRequest, GetRaceResponse>, res: Response) {
    const race = await raceService.getRaceById(req.params);

    if (!race) {
        res.status(404).json({ error: 'Race not found' });
        return;
    }

    res.json(race);
}

/**
 * Updates an existing race.
 */
export async function UpdateRace(req: ValidatedParamsBodyT<RaceIdParamRequest, UpdateRaceRequest, UpdateResponse>, res: Response) {
    await raceService.updateRace(req.params, req.body);
    res.json({ message: 'Race updated successfully' });
}

/**
 * Creates a new race.
 */
export async function CreateRace(req: ValidatedBodyT<CreateRaceRequest, CreateResponse>, res: Response) {
    const result = await raceService.createRace(req.body);
    res.status(201).json(result);
}

/**
 * Deletes a race.
 */
export async function DeleteRace(req: ValidatedParamsT<RaceIdParamRequest, UpdateResponse>, res: Response) {
    const result = await raceService.deleteRace(req.params);
    res.json(result);
}


