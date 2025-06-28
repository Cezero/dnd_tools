import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GenericList } from '@/components/GenericList/GenericList';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS, ClassFilterOptions } from '@/features/admin/features/classMgmt/config/ClassConfig';
import { FetchClasses, DeleteClass } from '@/features/admin/features/classMgmt/services/ClassService';
import { UseAuth } from '@/auth/AuthProvider';
import { RPG_DICE, EDITION_MAP } from '@shared/static-data/CommonData';

export function ClassList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = UseAuth();
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    const memoizedClassFilterOptions = useMemo(() => (
        ClassFilterOptions
    ), []);


    const classFetchData = useCallback(async (params: URLSearchParams) => {
        return await FetchClasses(params);
    }, []);

    const HandleNewClassClick = (): void => {
        navigate('/admin/classes/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteClass = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this class?')) {
            try {
                await DeleteClass(id);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete class:', error);
                alert('Failed to delete class.');
            }
        }
    };

    const RenderCell = (item: any, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = item[columnId];

        if (columnId === 'name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/classes/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item[columnId]}
                </a>
            );
        } else if (columnId === 'edition_id') {
            cellContent = EDITION_MAP[item[columnId]]?.abbr;
        } else if (columnId === 'is_prestige' || columnId === 'display' || columnId === 'caster') {
            cellContent = item[columnId] ? 'Yes' : 'No';
        } else if (columnId === 'hit_die') {
            cellContent = `${RPG_DICE[item[columnId]].name}`;
        }

        return cellContent;
    };

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Classes</h1>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewClassClick}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    New Class
                </button>
            </div>
            <GenericList
                storageKey="classes-list"
                defaultColumns={DEFAULT_COLUMNS}
                requiredColumnId="name"
                columnDefinitions={COLUMN_DEFINITIONS}
                fetchData={classFetchData}
                renderCell={RenderCell}
                detailPagePath="/admin/classes/:id"
                idKey="id"
                refreshTrigger={refreshTrigger}
                itemDesc="class"
                editHandler={(item: any) => navigate(`/admin/classes/${item.id}/edit`)}
                deleteHandler={(item: any) => HandleDeleteClass(item.id)}
                filterOptions={memoizedClassFilterOptions}
            />
        </div>
    );
}