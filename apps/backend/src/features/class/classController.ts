import { Response } from 'express';

import { ValidatedQueryT, ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types'
import {
    ClassIdParamRequest,
    ClassQueryRequest,ClassResponse,
    ClassQueryResponse,
    GetAllClassesResponse,
    CreateClassRequest,
    UpdateClassRequest
} from '@shared/schema';

import { classService } from './classService';
/**
 * Fetches all classes from the database with pagination and filtering.
 */
export async function GetClasses(req: ValidatedQueryT<ClassQueryRequest, ClassQueryResponse>, res: Response) {
    const result = await classService.getClasses(req.query);
    res.json(result);
}

export async function GetAllClasses(req: ValidatedNoInput<GetAllClassesResponse>, res: Response) {
    const classes = await classService.getAllClasses();
    res.json(classes);
}

/**
 * Fetches a single class by its ID.
 */
export async function GetClassById(req: ValidatedParamsT<ClassIdParamRequest, ClassResponse>, res: Response) {
    const cls = await classService.getClassById(req.params);

    if (!cls) {
        res.status(404).json({error: 'Class not found'});
        return;
    }

    res.json(cls);
}

/**
 * Creates a new class.
 */
export async function CreateClass(req: ValidatedBodyT<CreateClassRequest>, res: Response) {
    await classService.createClass(req.body);
    res.status(201).json({message: 'Class created successfully'});
}

/**
 * Updates an existing class.
 */
export async function UpdateClass(req: ValidatedParamsBodyT<ClassIdParamRequest, UpdateClassRequest>, res: Response) {
    await classService.updateClass(req.params, req.body);
    res.status(200).json({message: 'Class updated successfully'});
}

/**
 * Deletes a class.
 */
export async function DeleteClass(req: ValidatedParamsT<ClassIdParamRequest>, res: Response) {
    await classService.deleteClass(req.params);
    res.json({message: 'Class deleted successfully'});
}
