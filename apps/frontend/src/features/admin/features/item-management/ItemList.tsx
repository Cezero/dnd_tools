import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { COLUMN_DEFINITIONS } from '@/features/admin/features/item-management/ItemConfig';
import { ItemService } from '@/features/admin/features/item-management/ItemService';
import { ItemQuerySchema, ItemWithDetails } from '@shared/schema';
import { formatCostAsCurrency } from './utils';
import { ITEM_TYPES } from '@shared/static-data';

export function ItemList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    const HandleNewItemClick = (): void => {
        navigate('/admin/items/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteItem = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await ItemService.deleteItem(undefined, { id });
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete item:', error);
                alert('Failed to delete item.');
            }
        }
    };

    const RenderCell = (item: ItemWithDetails, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = String(item[columnId as keyof ItemWithDetails] || '');

        if (columnId === 'name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/items/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item.name}
                </a>
            );
        } else if (columnId === 'typeId') {
            cellContent = ITEM_TYPES[item.typeId].name;
        } else if (columnId === 'cost') {
            cellContent = formatCostAsCurrency(item.cost);
        } else if (columnId === 'weight') {
            cellContent = item.weight !== null ? `${item.weight} lbs` : '-';
        } else if (columnId === 'description') {
            const description = item.description || '';
            cellContent = description.length > 200 ? `${description.substring(0, 200)}...` : description;
        }

        return cellContent;
    };

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Items</h1>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewItemClick}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    New Item
                </button>
            </div>
            <GenericList<ItemWithDetails>
                storageKey="items-list"
                columnDefinitions={COLUMN_DEFINITIONS}
                querySchema={ItemQuerySchema}
                serviceFunction={ItemService.getItems}
                renderCell={RenderCell}
                detailPagePath="/admin/items/:id"
                itemDesc="item"
                editHandler={(item: ItemWithDetails) => navigate(`/admin/items/${item.id}/edit`)}
                deleteHandler={(item: ItemWithDetails) => HandleDeleteItem(item.id)}
                refreshTrigger={refreshTrigger}
            />
        </div>
    );
} 
