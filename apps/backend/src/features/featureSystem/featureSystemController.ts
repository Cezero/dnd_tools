import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedQueryT } from '@/util/validated-types';
import {
    FeatureIdParamRequest,
    CreateFeatureRequest,
    UpdateFeatureRequest,
    GetAllFeaturesResponse,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    CreateFeatureProgressionRequest,
} from '@shared/schema';

import { featureSystemService } from './featureSystemService.js';

/**
 * Fetches all features from the database.
 */
export async function GetAllFeatures(req: ValidatedQueryT<{ sourceType?: string }, GetAllFeaturesResponse>, res: Response) {
    const sourceType = req.query.sourceType ? Number(req.query.sourceType) : undefined;
    const features = await featureSystemService.getAllFeatures(sourceType);
    res.json(features);
}

/**
 * Fetches a single feature by its ID.
 */
export async function GetFeatureById(req: ValidatedParamsT<FeatureIdParamRequest, GetFeatureResponse>, res: Response) {
    const feature = await featureSystemService.getFeatureById(req.params);

    if (!feature) {
        res.status(404).json({ error: 'Feature not found' });
        return;
    }

    res.json(feature);
}

/**
 * Creates a new feature.
 */
export async function CreateFeature(req: ValidatedBodyT<CreateFeatureRequest, CreateResponse>, res: Response) {
    const result = await featureSystemService.createFeature(req.body);
    res.status(201).json(result);
}

/**
 * Updates an existing feature by slug.
 */
export async function UpdateFeature(req: ValidatedParamsBodyT<FeatureIdParamRequest, UpdateFeatureRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.updateFeature(req.params, req.body);
    res.status(200).json(result);
}

/**
 * Updates an existing feature by ID.
 */
export async function UpdateFeatureById(req: ValidatedParamsBodyT<FeatureIdParamRequest, UpdateFeatureRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.updateFeatureById(req.params, req.body);
    res.status(200).json(result);
}

/**
 * Deletes a feature by its slug.
 */
export async function DeleteFeature(req: ValidatedParamsT<FeatureIdParamRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.deleteFeature(req.params);
    res.status(200).json(result);
}

/**
 * Deletes a feature by its ID.
 */
export async function DeleteFeatureById(req: ValidatedParamsT<FeatureIdParamRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.deleteFeatureById(req.params);
    res.status(200).json(result);
}

/**
 * Creates feature progressions with all related entities (modifiers, choices, effects).
 * Used for bulk operations when creating/updating classes and races.
 */
export async function CreateFeatureProgressionWithRelations(req: ValidatedBodyT<CreateFeatureProgressionRequest, CreateResponse>, res: Response) {
    const result = await featureSystemService.createFeatureProgressionWithRelations(req.body);
    res.status(201).json(result);
} 
