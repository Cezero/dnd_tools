import { Request, Response } from 'express';

import { featService } from './featService.js';

import type {
    FeatRequest,
    FeatCreateRequest,
    FeatUpdateRequest,
    FeatDeleteRequest
} from './types';

/**
 * Fetches all feats from the database with pagination and filtering.
 */
export const GetFeats = async (req: FeatRequest, res: Response): Promise<void> => {
    try {
        const result = await featService.getAllFeats(req.query);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

export const GetAllFeats = async (req: Request, res: Response): Promise<void> => {
    try {
        const feats = await featService.getAllFeatsSimple();
        res.json(feats);
    } catch (error) {
        console.error('Error fetching all feats:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches a single feat by its ID.
 */
export const GetFeatById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const feat = await featService.getFeatById(parseInt(id));

        if (!feat) {
            res.status(404).send('Feat not found');
            return;
        }

        res.json(feat);
    } catch (error) {
        console.error('Error fetching feat by ID:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Creates a new feat.
 */
export const CreateFeat = async (req: FeatCreateRequest, res: Response): Promise<void> => {
    try {
        const result = await featService.createFeat(req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating feat:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Updates an existing feat.
 */
export const UpdateFeat = async (req: FeatUpdateRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        const result = await featService.updateFeat(parseInt(id), req.body);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating feat:', error);
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            res.status(404).send('Feat not found or no changes made');
        } else {
            res.status(500).send('Server error');
        }
    }
};

/**
 * Deletes a feat by its ID.
 */
export const DeleteFeat = async (req: FeatDeleteRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    try {
        await featService.deleteFeat(parseInt(id));
        res.status(204).send(); // No Content
    } catch (error) {
        console.error('Error deleting feat:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            res.status(404).send('Feat not found');
        } else {
            res.status(500).send('Server error');
        }
    }
}; 