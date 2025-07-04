import { Response } from 'express';

import {
    ValidatedQueryT,
    ValidatedParamsT,
    ValidatedParamsBodyT,
    ValidatedBodyT,
    ValidatedNoInput
} from '@/util/validated-types'
import {
    RaceTraitResponse,
    RaceResponse,
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
export async function GetRaceById(req: ValidatedParamsT<RaceIdParamRequest, RaceResponse>, res: Response) {
    const race = await raceService.getRaceById(req.params);

    if (!race) {
        res.status(404).json({error: 'Race not found'});
        return;
    }

    res.json(race);
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
export async function GetRaceTraitBySlug(req: ValidatedParamsT<RaceTraitSlugParamRequest, RaceTraitResponse>, res: Response) {
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
 * Creates a new race.
 */
export async function CreateRace(req: ValidatedBodyT<CreateRaceRequest>, res: Response) {
    await raceService.createRace(req.body);
    res.status(201).json({message: 'Race created successfully'});
}

/**
 * Creates a new race trait.
 */
export async function CreateRaceTrait(req: ValidatedBodyT<CreateRaceTraitRequest>, res: Response) {
    await raceService.createRaceTrait(req.body);
    res.status(201).json({message: 'Race trait created successfully'});
}

/**
 * Updates an existing race.
 */
export async function UpdateRace(req: ValidatedParamsBodyT<RaceIdParamRequest, UpdateRaceRequest, RaceResponse>, res: Response) {
    await raceService.updateRace(req.params, req.body);
    res.json({message: 'Race updated successfully'});
}

/**
 * Updates an existing race trait.
 */
export async function UpdateRaceTrait(req: ValidatedParamsBodyT<RaceTraitSlugParamRequest, UpdateRaceTraitRequest, RaceTraitResponse>, res: Response) {
    await raceService.updateRaceTrait(req.params, req.body);
    res.json({message: 'Race trait updated successfully'});
}

/**
 * Deletes a race.
 */
export async function DeleteRace(req: ValidatedParamsT<RaceIdParamRequest>, res: Response) {
    await raceService.deleteRace(req.params);
    res.json({message: 'Race deleted successfully'});
}

/**
 * Deletes a race trait.
 */
export async function DeleteRaceTrait(req: ValidatedParamsT<RaceTraitSlugParamRequest>, res: Response) {
    await raceService.deleteRaceTrait(req.params);
    res.json({message: 'Race trait deleted successfully'});
} 