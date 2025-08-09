import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput, ValidatedQueryT } from '@/util/validated-types';
import {
    FeatureIdParamRequest,
    FeatureSlugParamRequest,
    CreateFeatureRequest,
    UpdateFeatureRequest,
    GetAllFeaturesResponse,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    GetFeatureProgressionsResponse,
    CreateFeatureProgressionRequest,
    UpdateFeatureProgressionRequest,
    CreateFeatureProgressionWithRelationsRequest,
    GetFeatureModifiersResponse,
    CreateFeatureModifierRequest,
    UpdateFeatureModifierRequest,
    GetFeatureChoicesResponse,
    CreateFeatureChoiceRequest,
    UpdateFeatureChoiceRequest,
    GetFeatureSpecialEffectsResponse,
    CreateFeatureSpecialEffectRequest,
    UpdateFeatureSpecialEffectRequest,
    GetFeaturePrerequisitesResponse,
    CreateFeaturePrerequisiteRequest,
    UpdateFeaturePrerequisiteRequest,
    GetFeatureModifierConditionsResponse,
    CreateFeatureModifierConditionRequest,
    UpdateFeatureModifierConditionRequest,
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
 * Fetches a single feature by its slug.
 */
export async function GetFeatureBySlug(req: ValidatedParamsT<FeatureSlugParamRequest, GetFeatureResponse>, res: Response) {
    const feature = await featureSystemService.getFeatureBySlug(req.params);

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
 * Updates an existing feature.
 */
export async function UpdateFeature(req: ValidatedParamsBodyT<FeatureSlugParamRequest, UpdateFeatureRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.updateFeature(req.params, req.body);
    res.status(200).json(result);
}

/**
 * Deletes a feature by its slug.
 */
export async function DeleteFeature(req: ValidatedParamsT<FeatureSlugParamRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.deleteFeature(req.params);
    res.status(200).json(result);
}

/**
 * Fetches feature progressions for a given source type and source ID.
 */
export async function GetFeatureProgressions(req: ValidatedQueryT<{ sourceType: string; sourceId: string }, GetFeatureProgressionsResponse>, res: Response) {
    const { sourceType, sourceId } = req.query;
    const result = await featureSystemService.getFeatureProgressions(Number(sourceType), Number(sourceId));
    res.json(result);
}

/**
 * Creates a new feature progression.
 */
export async function CreateFeatureProgression(req: ValidatedBodyT<CreateFeatureProgressionRequest, CreateResponse>, res: Response) {
    const result = await featureSystemService.createFeatureProgression(req.body);
    res.status(201).json(result);
}

/**
 * Creates a new feature progression with related entities (modifiers, choices, effects).
 */
export async function CreateFeatureProgressionWithRelations(req: ValidatedBodyT<CreateFeatureProgressionWithRelationsRequest, CreateResponse>, res: Response) {
    const result = await featureSystemService.createFeatureProgressionWithRelations(req.body);
    res.status(201).json(result);
}

/**
 * Updates an existing feature progression.
 */
export async function UpdateFeatureProgression(req: ValidatedParamsBodyT<FeatureIdParamRequest, UpdateFeatureProgressionRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.updateFeatureProgression(req.params.id, req.body);
    res.status(200).json(result);
}

/**
 * Deletes a feature progression by its ID.
 */
export async function DeleteFeatureProgression(req: ValidatedParamsT<FeatureIdParamRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.deleteFeatureProgression(req.params.id);
    res.status(200).json(result);
}

/**
 * Fetches feature modifiers for a given progression ID.
 */
export async function GetFeatureModifiers(req: ValidatedParamsT<{ progressionId: string }, GetFeatureModifiersResponse>, res: Response) {
    const result = await featureSystemService.getFeatureModifiers(Number(req.params.progressionId));
    res.json(result);
}

/**
 * Creates a new feature modifier.
 */
export async function CreateFeatureModifier(req: ValidatedParamsBodyT<{ progressionId: string }, CreateFeatureModifierRequest, CreateResponse>, res: Response) {
    const data = { ...req.body, featureProgressionId: Number(req.params.progressionId) };
    const result = await featureSystemService.createFeatureModifier(data);
    res.status(201).json(result);
}

/**
 * Updates an existing feature modifier.
 */
export async function UpdateFeatureModifier(req: ValidatedParamsBodyT<FeatureIdParamRequest, UpdateFeatureModifierRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.updateFeatureModifier(req.params.id, req.body);
    res.status(200).json(result);
}

/**
 * Deletes a feature modifier by its ID.
 */
export async function DeleteFeatureModifier(req: ValidatedParamsT<FeatureIdParamRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.deleteFeatureModifier(req.params.id);
    res.status(200).json(result);
}

/**
 * Fetches feature choices for a given progression ID.
 */
export async function GetFeatureChoices(req: ValidatedParamsT<{ progressionId: string }, GetFeatureChoicesResponse>, res: Response) {
    const result = await featureSystemService.getFeatureChoices(Number(req.params.progressionId));
    res.json(result);
}

/**
 * Creates a new feature choice.
 */
export async function CreateFeatureChoice(req: ValidatedParamsBodyT<{ progressionId: string }, CreateFeatureChoiceRequest, CreateResponse>, res: Response) {
    const data = { ...req.body, progressionId: Number(req.params.progressionId) };
    const result = await featureSystemService.createFeatureChoice(data);
    res.status(201).json(result);
}

/**
 * Updates an existing feature choice.
 */
export async function UpdateFeatureChoice(req: ValidatedParamsBodyT<FeatureIdParamRequest, UpdateFeatureChoiceRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.updateFeatureChoice(req.params.id, req.body);
    res.status(200).json(result);
}

/**
 * Deletes a feature choice by its ID.
 */
export async function DeleteFeatureChoice(req: ValidatedParamsT<FeatureIdParamRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.deleteFeatureChoice(req.params.id);
    res.status(200).json(result);
}

/**
 * Fetches feature special effects for a given progression ID.
 */
export async function GetFeatureSpecialEffects(req: ValidatedParamsT<{ progressionId: string }, GetFeatureSpecialEffectsResponse>, res: Response) {
    const result = await featureSystemService.getFeatureSpecialEffects(Number(req.params.progressionId));
    res.json(result);
}

/**
 * Creates a new feature special effect.
 */
export async function CreateFeatureSpecialEffect(req: ValidatedParamsBodyT<{ progressionId: string }, CreateFeatureSpecialEffectRequest, CreateResponse>, res: Response) {
    const data = { ...req.body, progressionId: Number(req.params.progressionId) };
    const result = await featureSystemService.createFeatureSpecialEffect(data);
    res.status(201).json(result);
}

/**
 * Updates an existing feature special effect.
 */
export async function UpdateFeatureSpecialEffect(req: ValidatedParamsBodyT<FeatureIdParamRequest, UpdateFeatureSpecialEffectRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.updateFeatureSpecialEffect(req.params.id, req.body);
    res.status(200).json(result);
}

/**
 * Deletes a feature special effect by its ID.
 */
export async function DeleteFeatureSpecialEffect(req: ValidatedParamsT<FeatureIdParamRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.deleteFeatureSpecialEffect(req.params.id);
    res.status(200).json(result);
}

/**
 * Fetches feature modifier conditions for a given modifier ID.
 */
export async function GetFeatureModifierConditions(req: ValidatedParamsT<{ modifierId: string }, GetFeatureModifierConditionsResponse>, res: Response) {
    const result = await featureSystemService.getFeatureModifierConditions(Number(req.params.modifierId));
    res.json(result);
}

/**
 * Creates a new feature modifier condition.
 */
export async function CreateFeatureModifierCondition(req: ValidatedParamsBodyT<{ modifierId: string }, CreateFeatureModifierConditionRequest, CreateResponse>, res: Response) {
    const data = { ...req.body, featureModifierId: Number(req.params.modifierId) };
    const result = await featureSystemService.createFeatureModifierCondition(data);
    res.status(201).json(result);
}

/**
 * Updates an existing feature modifier condition.
 */
export async function UpdateFeatureModifierCondition(req: ValidatedParamsBodyT<FeatureIdParamRequest, UpdateFeatureModifierConditionRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.updateFeatureModifierCondition(req.params.id, req.body);
    res.status(200).json(result);
}

/**
 * Deletes a feature modifier condition by its ID.
 */
export async function DeleteFeatureModifierCondition(req: ValidatedParamsT<FeatureIdParamRequest, UpdateResponse>, res: Response) {
    const result = await featureSystemService.deleteFeatureModifierCondition(req.params.id);
    res.status(200).json(result);
} 
