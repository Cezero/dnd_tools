import { PrismaClient, Prisma } from '@shared/prisma-client';
import {
    ItemQueryRequest,
    ItemIdParamRequest,
    CreateItemRequest,
    UpdateItemRequest,
    ItemQueryResponse,
    ItemWithDetails,
    GetAllItemsResponse,
    CreateResponse,
    UpdateResponse
} from '@shared/schema';

const prisma = new PrismaClient();

export const itemService = {
    async getItems(query: ItemQueryRequest): Promise<ItemQueryResponse> {
        const page = query.page;
        const limit = query.limit;
        const offset = (page - 1) * limit;
        const where: Prisma.ItemWhereInput = {};

        console.log('Item query received:', query);

        if (query.name) where.name = { contains: query.name };
        if (query.typeId) where.typeId = query.typeId;

        // Handle cost filter - support partial matching and numeric comparison
        if (query.cost) {
            const costValue = query.cost.trim();
            if (costValue !== '') {
                // Try to parse as number for exact match
                const parsedCost = parseFloat(costValue);
                if (!isNaN(parsedCost)) {
                    // For numeric input, use exact match
                    where.cost = { equals: parsedCost };
                }
                // Note: Prisma Decimal fields don't support 'contains' for partial matching
                // For partial matching, we'd need to use string operations or different approach
            }
        }

        // Handle weight filter - support numeric comparison
        if (query.weight) {
            const weightValue = query.weight.trim();
            if (weightValue !== '') {
                // Try to parse as number for exact match
                const parsedWeight = parseFloat(weightValue);
                if (!isNaN(parsedWeight) && parsedWeight >= 0) {
                    where.weight = { equals: parsedWeight };
                }
                // If not a valid number, we could add range logic here later
                // For now, we only support exact numeric matches
            }
        }

        console.log('Prisma where clause:', where);

        const [items, total] = await Promise.all([
            prisma.item.findMany({
                where,
                include: { armor: true, weapon: true },
                skip: offset,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            prisma.item.count({ where }),
        ]);
        return {
            page,
            limit,
            total,
            results: items as ItemWithDetails[],
        };
    },
    async getAllItems(): Promise<GetAllItemsResponse> {
        return prisma.item.findMany({ include: { armor: true, weapon: true } }) as Promise<GetAllItemsResponse>;
    },
    async getItemById(params: ItemIdParamRequest): Promise<ItemWithDetails | null> {
        return prisma.item.findUnique({
            where: { id: params.id },
            include: { armor: true, weapon: true },
        }) as Promise<ItemWithDetails | null>;
    },
    async createItem(data: CreateItemRequest): Promise<CreateResponse> {
        const { armor, weapon, ...itemData } = data;
        const created = await prisma.item.create({
            data: {
                ...itemData,
                armor: armor ? { create: armor } : undefined,
                weapon: weapon ? { create: weapon } : undefined,
            },
            include: { armor: true, weapon: true },
        });
        return { id: created.id.toString(), message: 'Item created successfully' };
    },
    async updateItem(params: ItemIdParamRequest, data: UpdateItemRequest): Promise<UpdateResponse> {
        // For simplicity, delete and recreate armor/weapon if present
        await prisma.armor.deleteMany({ where: { id: params.id } });
        await prisma.weapon.deleteMany({ where: { id: params.id } });
        const { armor, weapon, ...itemData } = data;
        await prisma.item.update({
            where: { id: params.id },
            data: {
                ...itemData,
                armor: armor ? { create: armor } : undefined,
                weapon: weapon ? { create: weapon } : undefined,
            },
        });
        return { message: 'Item updated successfully' };
    },
    async deleteItem(params: ItemIdParamRequest): Promise<UpdateResponse> {
        await prisma.item.delete({ where: { id: params.id } });
        return { message: 'Item deleted successfully' };
    },
}; 
