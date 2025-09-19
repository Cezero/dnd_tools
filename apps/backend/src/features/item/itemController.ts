import { Response, NextFunction } from 'express';

import {
    ValidatedNoInput,
    ValidatedParamsT,
    ValidatedBodyT,
    ValidatedParamsBodyT,
    ValidatedQueryT,
} from '@/util/validated-types';
import {
    ItemIdParamRequest,
    ItemWithDetails,
    GetAllItemsResponse,
    CreateItemRequest,
    UpdateItemRequest,
    UpdateResponse,
    CreateResponse,
    ItemQueryRequest,
} from '@shared/schema';

import { itemService } from './itemService';

export async function GetAllItems(req: ValidatedNoInput<GetAllItemsResponse>, res: Response, _next: NextFunction) {
    const items = await itemService.getAllItems();
    res.json(items);
}

export async function GetItemQuery(req: ValidatedQueryT<ItemQueryRequest, GetAllItemsResponse>, res: Response, _next: NextFunction) {
    const items = await itemService.itemQuery(req.query);
    res.json(items);
}

export async function GetItemById(req: ValidatedParamsT<ItemIdParamRequest, ItemWithDetails>, res: Response, _next: NextFunction) {
    const item = await itemService.getItemById(req.params);
    if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
    }
    res.json(item);
}

export async function CreateItem(req: ValidatedBodyT<CreateItemRequest, CreateResponse>, res: Response, _next: NextFunction) {
    const result = await itemService.createItem(req.body);
    res.status(201).json(result);
}

export async function UpdateItem(req: ValidatedParamsBodyT<ItemIdParamRequest, UpdateItemRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await itemService.updateItem(req.params, req.body);
    res.json(result);
}

export async function DeleteItem(req: ValidatedParamsT<ItemIdParamRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await itemService.deleteItem(req.params);
    res.json(result);
} 
