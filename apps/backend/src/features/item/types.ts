import {
    UpdateItemRequest,
    CreateItemRequest,
    ItemIdParamRequest,
    GetAllItemsResponse,
    UpdateResponse,
    CreateResponse,
    ItemWithDetails,
} from '@shared/schema';

export interface ItemService {
    getAllItems: () => Promise<GetAllItemsResponse>;
    getItemById: (params: ItemIdParamRequest) => Promise<ItemWithDetails | null>;
    createItem: (data: CreateItemRequest) => Promise<CreateResponse>;
    updateItem: (params: ItemIdParamRequest, data: UpdateItemRequest) => Promise<UpdateResponse>;
    deleteItem: (params: ItemIdParamRequest) => Promise<UpdateResponse>;
}
