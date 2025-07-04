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
    UpdateReferenceTableRequest,
    CreateReferenceTableRequest,
    ReferenceTableQueryResponse,
    ReferenceTableSlugParamRequest,
} from '@shared/schema';

import { referenceTableService } from './referenceTableService';

export async function GetReferenceTables(req: ValidatedQueryT<ReferenceTableQueryRequest, ReferenceTableQueryResponse>, res: Response) {
    const result = await referenceTableService.getReferenceTables(req.query);
    res.json(result);
}

export async function CreateReferenceTable(req: ValidatedBodyT<CreateReferenceTableRequest>, res: Response) {
    await referenceTableService.createReferenceTable(req.body);
    res.status(201).json({ message: 'Reference table created successfully' });
}

export async function UpdateReferenceTable(req: ValidatedParamsBodyT<ReferenceTableSlugParamRequest, UpdateReferenceTableRequest>, res: Response) {
    await referenceTableService.updateReferenceTable(req.params, req.body);
    res.json({ message: 'Reference table updated successfully' });
}

export async function DeleteReferenceTable(req: ValidatedParamsT<ReferenceTableSlugParamRequest>, res: Response) {
    await referenceTableService.deleteReferenceTable(req.params);
    res.json({ message: 'Reference table deleted successfully' });
}

export async function GetReferenceTable(req: ValidatedParamsQueryT<ReferenceTableSlugParamRequest, ReferenceTableDataResponse>, res: Response) {
    const tableData = await referenceTableService.getReferenceTableData(req.params);
    if (!tableData) {
        res.status(404).json({error: 'Reference table not found'});
        return;
    }
    res.json(tableData);
}

