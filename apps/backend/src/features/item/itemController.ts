import { Response } from 'express';
import { ValidatedQueryT, ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types';
import {
    ItemQueryRequest,
    ItemQueryResponse,
    ItemIdParamRequest,
    ItemWithDetails,
    GetAllItemsResponse,
    CreateItemRequest,
    UpdateItemRequest,
    UpdateResponse,
    CreateResponse
} from '@shared/schema';
import { itemService } from './itemService';

export async function GetItems(req: ValidatedQueryT<ItemQueryRequest, ItemQueryResponse>, res: Response) {
    const result = await itemService.getItems(req.query);
    res.json(result);
}

export async function GetAllItems(req: ValidatedNoInput<GetAllItemsResponse>, res: Response) {
    const items = await itemService.getAllItems();
    res.json(items);
}

export async function GetItemById(req: ValidatedParamsT<ItemIdParamRequest, ItemWithDetails>, res: Response) {
    const item = await itemService.getItemById(req.params);
    if (!item) {
        res.status(404).json({ error: 'Item not found' });
        return;
    }
    res.json(item);
}

export async function CreateItem(req: ValidatedBodyT<CreateItemRequest, CreateResponse>, res: Response) {
    const result = await itemService.createItem(req.body);
    res.status(201).json(result);
}

export async function UpdateItem(req: ValidatedParamsBodyT<ItemIdParamRequest, UpdateItemRequest, UpdateResponse>, res: Response) {
    const result = await itemService.updateItem(req.params, req.body);
    res.json(result);
}

export async function DeleteItem(req: ValidatedParamsT<ItemIdParamRequest, UpdateResponse>, res: Response) {
    const result = await itemService.deleteItem(req.params);
    res.json(result);
} 