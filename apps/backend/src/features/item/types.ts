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
    getItemById: (id: ItemIdParamRequest) => Promise<ItemWithDetails | null>;
    createItem: (data: CreateItemRequest) => Promise<CreateResponse>;
    updateItem: (id: ItemIdParamRequest, data: UpdateItemRequest) => Promise<UpdateResponse>;
    deleteItem: (id: ItemIdParamRequest) => Promise<UpdateResponse>;
}
