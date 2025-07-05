import { Response } from 'express';

import {
    ValidatedQueryT,
    ValidatedParamsT,
    ValidatedParamsBodyT,
    ValidatedBodyT,
    ValidatedParamsQueryT
} from '@/util/validated-types'
import {
    ReferenceTableDataResponse,
    ReferenceTableQueryRequest,
    ReferenceTableUpdate,
    ReferenceTableQueryResponse,
    ReferenceTableSlugParamRequest,
    ReferenceTableSummary,
} from '@shared/schema';

import { referenceTableService } from './referenceTableService';

export async function GetReferenceTables(req: ValidatedQueryT<ReferenceTableQueryRequest, ReferenceTableQueryResponse>, res: Response) {
    const result = await referenceTableService.getReferenceTables(req.query);
    res.json(result);
}

export async function CreateReferenceTable(req: ValidatedBodyT<ReferenceTableUpdate>, res: Response) {
    await referenceTableService.createReferenceTable(req.body);
    res.status(201).json({ message: 'Reference table created successfully' });
}

export async function UpdateReferenceTable(req: ValidatedParamsBodyT<ReferenceTableSlugParamRequest, ReferenceTableUpdate>, res: Response) {
    const result = await referenceTableService.updateReferenceTable(req.params, req.body);
    res.json(result);
}

export async function DeleteReferenceTable(req: ValidatedParamsT<ReferenceTableSlugParamRequest>, res: Response) {
    const result = await referenceTableService.deleteReferenceTable(req.params);
    res.json(result);
}

export async function GetReferenceTable(req: ValidatedParamsQueryT<ReferenceTableSlugParamRequest, ReferenceTableDataResponse>, res: Response) {
    const tableData = await referenceTableService.getReferenceTableData(req.params);
    if (!tableData) {
        res.status(404).json({error: 'Reference table not found'});
        return;
    }
    res.json(tableData);
}

export async function GetReferenceTableSummary(req: ValidatedParamsQueryT<ReferenceTableSlugParamRequest, ReferenceTableSummary>, res: Response) {
    const summary = await referenceTableService.getReferenceTableSummary(req.params);
    res.json(summary);
}