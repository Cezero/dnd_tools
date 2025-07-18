import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { createIdDeleteServiceFunction } from '@/components/generic-list/types';
import { ITEM_COLUMNS } from './ItemColumns';
import { ItemService } from './ItemService';
import { ItemWithDetails } from '@shared/schema';
import { routes } from './ItemConfig';

export function ItemList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

    const HandleNewItemClick = (): void => {
        navigate('/admin/items/new/edit', { state: { fromListParams: location.search } });
    };

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Items</h1>
            {isAdmin && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={HandleNewItemClick}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        New Item
                    </button>
                </div>
            )}
            <GenericList<ItemWithDetails>
                storageKey="items-list"
                columns={ITEM_COLUMNS}
                serviceFunction={() => ItemService.getItems({})}
                itemDesc="item"
                routes={routes}
                deleteServiceFunction={createIdDeleteServiceFunction(ItemService.deleteItem)}
                basePath="/admin"
            />
        </div>
    );
} 
