import { Response, NextFunction } from 'express';

import {
    ValidatedNoInput,
    ValidatedParamsT,
    ValidatedParamsQueryT,
    ValidatedBodyT,
    ValidatedParamsBodyT,
} from '@/util/validated-types';
import {
    Race,
    GetFeaturesResponse,
    IdParamRequest,
    RaceIdQueryRequest,
    CreateRaceRequest,
    UpdateRaceRequest,
    GetAllRacesResponse,
    UpdateResponse,
    CreateResponse,
    RaceCacheResponse,
} from '@shared/schema';
import { DraftType } from '@shared/static-data';

import { raceService } from './raceService';
import { DraftLockService } from '../shared/draftState/DraftLockService';


let draftLockServiceInstance: DraftLockService | null = null;

function getDraftLockService(): DraftLockService {
    if (!draftLockServiceInstance) {
        draftLockServiceInstance = new DraftLockService();
    }
    return draftLockServiceInstance;
}

/**
 * Fetches all races from the database with pagination and filtering.
 */
export async function GetAllRaces(req: ValidatedNoInput<GetAllRacesResponse>, res: Response, _next: NextFunction) {
    const races = await raceService.getAllRaces();
    res.json(races);
}

/**
 * Fetches a single race by its ID.
 * Optionally accepts character feature choices to enrich features with choice data.
 */
export async function GetRaceById(
    req: ValidatedParamsQueryT<IdParamRequest, RaceIdQueryRequest, Race>,
    res: Response,
    _next: NextFunction
) {
    const race = await raceService.getRaceById(req.params, req.query.characterFeatureChoices);

    if (!race) {
        res.status(404).json({ error: 'Race not found' });
        return;
    }

    res.json(race);
}

/**
 * Fetches feature progressions for a race. Used by RaceDetail/RaceDisplay to resolve featureIds to FeatureWithRelations[].
 */
export async function GetRaceFeatures(
    req: ValidatedParamsQueryT<IdParamRequest, RaceIdQueryRequest, GetFeaturesResponse>,
    res: Response,
    _next: NextFunction
) {
    const features = await raceService.getRaceFeatures(req.params, req.query.characterFeatureChoices);
    res.json(features);
}

/**
 * Updates an existing race.
 */
export async function UpdateRace(req: ValidatedParamsBodyT<IdParamRequest, UpdateRaceRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    try {
        await raceService.updateRace(req.params, req.body);
        res.json({ message: 'Race updated successfully' });
    } catch (error) {
        console.error('Error updating race:', error);
        res.status(500).json({
            message: 'Failed to update race',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
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
export async function DeleteRace(req: ValidatedParamsT<IdParamRequest, UpdateResponse>, res: Response, _next: NextFunction) {
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

/**
 * Gets the lock status for a race.
 * 
 * Returns whether the race is currently locked and, if so, which user holds the lock.
 * This is a read-only operation that doesn't require authentication.
 */
export async function GetRaceLockStatus(
    req: ValidatedParamsT<IdParamRequest>,
    res: Response,
    _next: NextFunction
) {
    const lockService = getDraftLockService();
    const lockedBy = await lockService.checkLock(DraftType.Race, req.params.id);

    if (lockedBy === null) {
        res.json({ locked: false });
    } else {
        res.json({ locked: true, lockedBy });
    }
}


