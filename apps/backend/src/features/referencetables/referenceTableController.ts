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
    ReferenceTableIdentifierRequest,
    CreateReferenceTableRequest,
    ReferenceTableQueryResponse,
} from '@shared/schema';

import { referenceTableService } from './referenceTableService';

export async function GetReferenceTables(req: ValidatedQueryT<ReferenceTableQueryRequest, ReferenceTableQueryResponse>, res: Response) {
    const result = await referenceTableService.getReferenceTables(req.query);
    res.json({
        success: true,
        data: result,
    });
}

export async function CreateReferenceTable(req: ValidatedBodyT<CreateReferenceTableRequest>, res: Response) {
    const result = await referenceTableService.createReferenceTable(req.body);
    res.status(201).json({
        success: true,
        data: result,
    });
}

export async function UpdateReferenceTable(req: ValidatedParamsBodyT<ReferenceTableIdentifierRequest, UpdateReferenceTableRequest>, res: Response) {
    const result = await referenceTableService.updateReferenceTable(req.params, req.body);
    res.json({
        success: true,
        data: result,
    });
}

export async function DeleteReferenceTable(req: ValidatedParamsT<ReferenceTableIdentifierRequest>, res: Response) {
    const result = await referenceTableService.deleteReferenceTable(req.params);
    res.json({
        success: true,
        data: result,
    });
}

export async function GetReferenceTable(req: ValidatedParamsQueryT<ReferenceTableIdentifierRequest, ReferenceTableDataResponse>, res: Response) {
    const tableData = await referenceTableService.getReferenceTableData(req.params);
    if (!tableData) {
        res.status(404).json({
            success: false,
            error: 'Reference table not found',
        });
        return;
    }
    res.json({
        success: true,
        data: tableData,
    });
}

