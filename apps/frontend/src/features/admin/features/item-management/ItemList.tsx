import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { ITEM_COLUMNS } from '@/features/admin/features/item-management/ItemColumns';
import { ItemService } from '@/features/admin/features/item-management/ItemService';
import { ItemWithDetails } from '@shared/schema';
import { routes } from './ItemConfig';

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
                columns={ITEM_COLUMNS}
                serviceFunction={() => ItemService.getItems({})}
                itemDesc="item"
                routes={routes}
            />
        </div>
    );
} 
