import { PrismaClient, Prisma } from '@shared/prisma-client';
import {
    ItemIdParamRequest,
    CreateItemRequest,
    UpdateItemRequest,
    ItemWithDetails,
    GetAllItemsResponse,
    CreateResponse,
    UpdateResponse,
    ItemCacheResponse,
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
    /**
     * Get item cache data for lightweight operations (dropdowns, filtering, etc.)
     * 
     * Returns minimal item data optimized for performance, including only essential fields
     * needed for common UI operations. The cache includes weaponCategory and armorCategory
     * to enable client-side filtering by proficiency type.
     * 
     * **Data Structure**:
     * - Includes: id, name, typeId, weaponCategory, armorCategory
     * - Excludes: description, cost, weight, quantity, sizeId (heavy fields)
     * 
     * **Transformation**:
     * - Flattens weapon.category and armor.category from nested objects to top-level fields
     * - Sets weaponCategory/armorCategory to null if item doesn't have weapon/armor
     * 
     * **Usage**: Used by `/items/cache` endpoint for client-side filtering operations.
     * All filtering is performed client-side using this cache data, eliminating the need
     * for server-side query endpoints.
     * 
     * @returns Promise resolving to ItemCacheResponse with lightweight item data
     * 
     * @see ItemCacheSchema for complete schema definition
     * @see [Query Hooks and Caching Architecture](../../../../packages/shared/docs/application-overview/query-hooks-and-caching.md)
     */
    async getItemCache(): Promise<ItemCacheResponse> {
        const items = await prisma.item.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                typeId: true,
                weapon: {
                    select: {
                        category: true,
                    },
                },
                armor: {
                    select: {
                        category: true,
                    },
                },
            }
        });
        
        return {
            total: items.length,
            results: items.map(item => ({
                id: item.id,
                name: item.name,
                typeId: item.typeId,
                weaponCategory: item.weapon?.category ?? null,
                armorCategory: item.armor?.category ?? null,
            })),
        };
    },
}; 
