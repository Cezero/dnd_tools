import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types';
import {
    TransformationFormIdParamRequest,
    FeatureIdForTransformationFormsParamRequest,
    CreateTransformationFormRequest,
    UpdateTransformationFormRequest,
    GetAllTransformationFormsResponse,
    GetTransformationFormResponse,
    GetTransformationFormsByFeatureResponse,
} from '@shared/schema';

import { transformationFormService } from './transformationFormService.js';

/**
 * Fetches all transformation form eligibilities from the database.
 */
export async function GetAllTransformationForms(req: ValidatedNoInput<GetAllTransformationFormsResponse>, res: Response) {
    const forms = await transformationFormService.getAllTransformationForms();
    res.json(forms);
}

/**
 * Fetches a single transformation form eligibility by its ID.
 */
export async function GetTransformationFormById(req: ValidatedParamsT<TransformationFormIdParamRequest, GetTransformationFormResponse>, res: Response) {
    const form = await transformationFormService.getTransformationFormById(req.params);

    if (!form) {
        res.status(404).json({ error: 'Transformation form eligibility not found' });
        return;
    }

    res.json(form);
}

/**
 * Fetches all transformation form eligibilities for a specific feature.
 */
export async function GetTransformationFormsByFeature(req: ValidatedParamsT<FeatureIdForTransformationFormsParamRequest, GetTransformationFormsByFeatureResponse>, res: Response) {
    const forms = await transformationFormService.getTransformationFormsByFeature(req.params);
    res.json(forms);
}

/**
 * Creates a new transformation form eligibility.
 */
export async function CreateTransformationForm(req: ValidatedBodyT<CreateTransformationFormRequest, GetTransformationFormResponse>, res: Response) {
    const form = await transformationFormService.createTransformationForm(req.body);
    res.status(201).json(form);
}

/**
 * Updates an existing transformation form eligibility.
 */
export async function UpdateTransformationForm(req: ValidatedParamsBodyT<TransformationFormIdParamRequest, UpdateTransformationFormRequest, GetTransformationFormResponse>, res: Response) {
    const form = await transformationFormService.updateTransformationForm(req.body, req.params);
    res.json(form);
}

/**
 * Deletes a transformation form eligibility.
 */
export async function DeleteTransformationForm(req: ValidatedParamsT<TransformationFormIdParamRequest, void>, res: Response) {
    await transformationFormService.deleteTransformationForm(req.params);
    res.status(204).send();
}

