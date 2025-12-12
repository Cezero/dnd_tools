import { Response, NextFunction } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT } from '@/util/validated-types';
import {
    GetAllFeaturesResponse,
    CreateFeatureRequest,
    UpdateFeatureRequest,
    FeatureIdParamRequest,
    FeatureQueryRequest,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    CreateFeatureProgressionRequest,
    UpdateFeatureProgressionsRequest,
    GetFeatureProgressionsResponse,
    GetFeatureListResponse,
} from '@shared/schema';

import { featureSystemService } from './featureSystemService.js';

/**
 * Fetches all features from the database.
 */
export async function GetAllFeatures(req: ValidatedBodyT<FeatureQueryRequest, GetAllFeaturesResponse>, res: Response, _next: NextFunction) {
    const features = await featureSystemService.getAllFeatures(req.body.sourceTypes);
    res.json(features);
}

/**
 * Fetches a list of features with only id and name for dropdown selection.
 */
export async function GetFeatureList(req: ValidatedBodyT<FeatureQueryRequest, GetFeatureListResponse>, res: Response, _next: NextFunction) {
    const features = await featureSystemService.getFeatureList(req.body.sourceTypes);
    res.json(features);
}

/**
 * Fetches a single feature by its ID.
 */
export async function GetFeatureById(req: ValidatedParamsT<FeatureIdParamRequest, GetFeatureResponse>, res: Response, _next: NextFunction) {
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
export async function CreateFeature(req: ValidatedBodyT<CreateFeatureRequest, CreateResponse>, res: Response, _next: NextFunction) {
    const result = await featureSystemService.createFeature(req.body);
    res.status(201).json(result);
}

/**
 * Updates an existing feature by slug.
 */
export async function UpdateFeature(req: ValidatedParamsBodyT<FeatureIdParamRequest, UpdateFeatureRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await featureSystemService.updateFeature(req.params, req.body);
    res.status(200).json(result);
}

/**
 * Updates an existing feature by ID.
 */
export async function UpdateFeatureById(req: ValidatedParamsBodyT<FeatureIdParamRequest, UpdateFeatureRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await featureSystemService.updateFeature(req.params, req.body);
    res.status(200).json(result);
}

/**
 * Deletes a feature by its slug.
 */
export async function DeleteFeature(req: ValidatedParamsT<FeatureIdParamRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await featureSystemService.deleteFeature(req.params);
    res.status(200).json(result);
}

/**
 * Deletes a feature by its ID.
 */
export async function DeleteFeatureById(req: ValidatedParamsT<FeatureIdParamRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await featureSystemService.deleteFeature(req.params);
    res.status(200).json(result);
}

/**
 * Creates feature progressions with all related entities.
 * Used for bulk operations when creating/updating classes and races.
 */
export async function CreateFeatureProgressionWithRelations(req: ValidatedBodyT<CreateFeatureProgressionRequest, CreateResponse>, res: Response, _next: NextFunction) {
    const result = await featureSystemService.createFeatureProgressionWithRelations(req.body);
    res.status(201).json(result);
}

/**
 * Updates feature progressions for a specific feature.
 */
export async function UpdateFeatureProgressions(req: ValidatedParamsBodyT<FeatureIdParamRequest, UpdateFeatureProgressionsRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await featureSystemService.updateFeatureProgressions(req.params.id, req.body.progressions);
    res.status(200).json(result);
}

/**
 * Gets all feature progressions for a specific feature.
 */
export async function GetFeatureProgressions(req: ValidatedParamsT<FeatureIdParamRequest, GetFeatureProgressionsResponse>, res: Response, _next: NextFunction) {
    const progressions = await featureSystemService.getFeatureProgressions(req.params.id);
    res.status(200).json(progressions);
} 
