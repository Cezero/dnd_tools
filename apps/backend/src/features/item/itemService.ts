import { PrismaClient, Prisma } from '@shared/prisma-client';
import {
    ItemIdParamRequest,
    CreateItemRequest,
    UpdateItemRequest,
    ItemWithDetails,
    GetAllItemsResponse,
    CreateResponse,
    UpdateResponse
} from '@shared/schema';

import type { ItemService } from './types';

const prisma = new PrismaClient();

export const itemService: ItemService = {
    async getAllItems(): Promise<GetAllItemsResponse> {
        const [items] = await Promise.all([
            prisma.item.findMany({
                include: {
                    armor: true,
                    weapon: true
                },
                orderBy: { name: 'asc' }
            }),
            prisma.item.count()
        ]);
        return {
            total: items.length,
            results: items,
        };
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
