import { Request, Response } from 'express';

import { raceService } from './raceService';
import type {
    RaceRequest,
    RaceCreateRequest,
    RaceUpdateRequest,
    RaceDeleteRequest,
    RaceTraitRequest,
    RaceTraitCreateRequest,
    RaceTraitUpdateRequest,
    RaceTraitDeleteRequest
} from './types';

/**
 * Fetches all races from the database with pagination and filtering.
 */
export const GetRaces = async (req: RaceRequest, res: Response): Promise<void> => {
    try {
        const result = await raceService.getAllRaces(req.query);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error fetching races:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch races',
        });
    }
};

export const GetAllRaces = async (req: Request, res: Response): Promise<void> => {
    try {
        const races = await raceService.getAllRacesSimple();
        res.json({
            success: true,
            data: races,
        });
    } catch (error) {
        console.error('Error fetching all races:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch all races',
        });
    }
};

/**
 * Fetches a single race by its ID.
 */
export const GetRaceById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const race = await raceService.getRaceById(parseInt(id));

        if (!race) {
            res.status(404).json({
                success: false,
                error: 'Race not found',
            });
            return;
        }

        res.json({
            success: true,
            data: race,
        });
    } catch (error) {
        console.error('Error fetching race by ID:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch race',
        });
    }
};

/**
 * Fetches all race traits from the database.
 */
export const GetRaceTraits = async (req: RaceTraitRequest, res: Response): Promise<void> => {
    try {
        const result = await raceService.getAllRaceTraits(req.query);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error fetching race traits:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch race traits',
        });
    }
};

/**
 * Fetches a single race trait by its slug.
 */
export const GetRaceTraitBySlug = async (req: Request<{ slug: string }>, res: Response): Promise<void> => {
    const { slug } = req.params;
    try {
        const trait = await raceService.getRaceTraitBySlug(slug);

        if (!trait) {
            res.status(404).json({
                success: false,
                error: 'Race trait not found',
            });
            return;
        }

        res.json({
            success: true,
            data: trait,
        });
    } catch (error) {
        console.error('Error fetching race trait by slug:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch race trait',
        });
    }
};

export const GetAllRaceTraits = async (req: Request, res: Response): Promise<void> => {
    try {
        const traits = await raceService.getAllRaceTraitsSimple();
        res.json({
            success: true,
            data: traits,
        });
    } catch (error) {
        console.error('Error fetching all race traits:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch all race traits',
        });
    }
};

/**
 * Creates a new race.
 */
export const CreateRace = async (req: RaceCreateRequest, res: Response): Promise<void> => {
    try {
        const result = await raceService.createRace(req.body);
        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error creating race:', error);
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to create race',
            });
        }
    }
};

/**
 * Creates a new race trait.
 */
export const CreateRaceTrait = async (req: RaceTraitCreateRequest, res: Response): Promise<void> => {
    try {
        const result = await raceService.createRaceTrait(req.body);
        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error creating race trait:', error);
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to create race trait',
            });
        }
    }
};

/**
 * Updates an existing race.
 */
export const UpdateRace = async (req: RaceUpdateRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await raceService.updateRace(parseInt(id), req.body);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error updating race:', error);
        if (error instanceof Error) {
            if (error.message.includes('Record to update not found')) {
                res.status(404).json({
                    success: false,
                    error: 'Race not found',
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            }
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to update race',
            });
        }
    }
};

/**
 * Updates an existing race trait.
 */
export const UpdateRaceTrait = async (req: RaceTraitUpdateRequest, res: Response): Promise<void> => {
    const { slug } = req.params;
    try {
        const result = await raceService.updateRaceTrait(slug, req.body);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error updating race trait:', error);
        if (error instanceof Error) {
            if (error.message.includes('Record to update not found')) {
                res.status(404).json({
                    success: false,
                    error: 'Race trait not found',
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            }
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to update race trait',
            });
        }
    }
};

/**
 * Deletes a race by its ID.
 */
export const DeleteRace = async (req: RaceDeleteRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await raceService.deleteRace(parseInt(id));
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error deleting race:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            res.status(404).json({
                success: false,
                error: 'Race not found',
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to delete race',
            });
        }
    }
};

/**
 * Deletes a race trait by its slug.
 */
export const DeleteRaceTrait = async (req: RaceTraitDeleteRequest, res: Response): Promise<void> => {
    const { slug } = req.params;
    try {
        const result = await raceService.deleteRaceTrait(slug);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error deleting race trait:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            res.status(404).json({
                success: false,
                error: 'Race trait not found',
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to delete race trait',
            });
        }
    }
}; 