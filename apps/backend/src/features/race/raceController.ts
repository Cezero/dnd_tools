import { Response } from 'express';

import {
    ValidatedQueryT,
    ValidatedParamsT,
    ValidatedParamsBodyT,
    ValidatedBodyT,
    ValidatedNoInput
} from '@/util/validated-types'
import {
    GetRaceTraitResponse,
    GetRaceResponse,
    RaceTraitQueryRequest,
    RaceQueryRequest,
    RaceIdParamRequest,
    RaceTraitSlugParamRequest,
    CreateRaceRequest,
    CreateRaceTraitRequest,
    UpdateRaceRequest,
    UpdateRaceTraitRequest,
    RaceQueryResponse,
    RaceTraitQueryResponse,
    RaceTraitGetAllResponse,
    UpdateResponse,
    CreateResponse,
} from '@shared/schema';

import { raceService } from './raceService';
/**
 * Fetches all races from the database with pagination and filtering.
 */
export async function GetRaces(req: ValidatedQueryT<RaceQueryRequest, RaceQueryResponse>, res: Response) {
    const result = await raceService.getRaces(req.query);
    res.json(result);
}

/**
 * Fetches a single race by its ID.
 */
export async function GetRaceById(req: ValidatedParamsT<RaceIdParamRequest, GetRaceResponse>, res: Response) {
    const race = await raceService.getRaceById(req.params);

    if (!race) {
        res.status(404).json({error: 'Race not found'});
        return;
    }

    res.json(race);
}

/**
 * Updates an existing race.
 */
export async function UpdateRace(req: ValidatedParamsBodyT<RaceIdParamRequest, UpdateRaceRequest, UpdateResponse>, res: Response) {
    await raceService.updateRace(req.params, req.body);
    res.json({message: 'Race updated successfully'});
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

/**
 * Fetches all race traits from the database.
 */
export async function GetRaceTraits(req: ValidatedQueryT<RaceTraitQueryRequest, RaceTraitQueryResponse>, res: Response) {
    const result = await raceService.getRaceTraits(req.query);
    res.json(result);
}

/**
 * Fetches a single race trait by its slug.
 */
export async function GetRaceTraitBySlug(req: ValidatedParamsT<RaceTraitSlugParamRequest, GetRaceTraitResponse>, res: Response) {
    const trait = await raceService.getRaceTraitBySlug(req.params);

    if (!trait) {
        res.status(404).json({error: 'Race trait not found'});
        return;
    }

    res.json(trait);
}

export async function GetAllRaceTraits(req: ValidatedNoInput<RaceTraitGetAllResponse>, res: Response) {
    const traits = await raceService.getRaceTraitsList();
    res.json(traits);
}

/**
 * Creates a new race trait.
 */
export async function CreateRaceTrait(req: ValidatedBodyT<CreateRaceTraitRequest, CreateResponse>, res: Response) {
    const result = await raceService.createRaceTrait(req.body);
    res.status(201).json(result);
}

/**
 * Updates an existing race trait.
 */
export async function UpdateRaceTrait(req: ValidatedParamsBodyT<RaceTraitSlugParamRequest, UpdateRaceTraitRequest, UpdateResponse>, res: Response) {
    const result = await raceService.updateRaceTrait(req.params, req.body);
    res.json(result);
}

/**
 * Deletes a race trait.
 */
export async function DeleteRaceTrait(req: ValidatedParamsT<RaceTraitSlugParamRequest, UpdateResponse>, res: Response) {
    const result = await raceService.deleteRaceTrait(req.params);
    res.json(result);
} 