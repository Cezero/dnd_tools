import { Response, NextFunction } from 'express';

import {
    ValidatedNoInput,
    ValidatedParamsT,
    ValidatedParamsQueryT,
    ValidatedBodyT,
    ValidatedParamsBodyT,
    ValidatedQueryT,
} from '@/util/validated-types';
import {
    Race,
    RaceIdParamRequest,
    RaceIdQuerySchema,
    CreateRaceRequest,
    UpdateRaceRequest,
    GetAllRacesResponse,
    UpdateResponse,
    CreateResponse,
    RaceCacheResponse,
} from '@shared/schema';
import { z } from 'zod';

import { raceService } from './raceService';
/**
 * Fetches all races from the database with pagination and filtering.
 */
export async function GetAllRaces(req: ValidatedNoInput<GetAllRacesResponse>, res: Response, _next: NextFunction) {
    const races = await raceService.getAllRaces();
    res.json(races);
}

/**
 * Fetches a single race by its ID.
 * Optionally accepts character feature choices to enrich progressions with choice data.
 */
export async function GetRaceById(
    req: ValidatedParamsQueryT<RaceIdParamRequest, z.infer<typeof RaceIdQuerySchema>, Race>,
    res: Response,
    _next: NextFunction
) {
    const choices = req.query.characterFeatureChoices;
    const race = await raceService.getRaceById(req.params, choices);

    if (!race) {
        res.status(404).json({ error: 'Race not found' });
        return;
    }

    res.json(race);
}

/**
 * Updates an existing race.
 */
export async function UpdateRace(req: ValidatedParamsBodyT<RaceIdParamRequest, UpdateRaceRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    await raceService.updateRace(req.params, req.body);
    res.json({ message: 'Race updated successfully' });
}

/**
 * Creates a new race.
 */
export async function CreateRace(req: ValidatedBodyT<CreateRaceRequest, CreateResponse>, res: Response, _next: NextFunction) {
    const result = await raceService.createRace(req.body);
    res.status(201).json(result);
}

/**
 * Deletes a race.
 */
export async function DeleteRace(req: ValidatedParamsT<RaceIdParamRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await raceService.deleteRace(req.params);
    res.json(result);
}

/**
 * Fetches all races for cache (lightweight data).
 */
export async function GetRaceCache(req: ValidatedNoInput<RaceCacheResponse>, res: Response, _next: NextFunction) {
    const races = await raceService.getRaceCache();
    res.json(races);
}


