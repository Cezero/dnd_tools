import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GenericList } from '@/components/generic-list';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS, ClassFilterOptions } from '@/features/admin/features/class-management/ClassConfig';
import { FetchClasses, DeleteClass } from '@/features/admin/features/class-management/ClassService';
import { useAuthAuto } from '@/components/auth';
import { RPG_DICE, EDITION_MAP } from '@shared/static-data';
import { ClassResponse } from '@shared/schema';


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

    const RenderCell = (item: ClassResponse, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = String(item[columnId as keyof ClassResponse] || '');

        if (columnId === 'name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/classes/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item.name}
                </a>
            );
        } else if (columnId === 'edition_id') {
            cellContent = EDITION_MAP[item.editionId]?.abbr;
        } else if (columnId === 'is_prestige' || columnId === 'display' || columnId === 'caster') {
            const value = columnId === 'is_prestige' ? item.isPrestige :
                columnId === 'display' ? item.isVisible :
                    item.canCastSpells;
            cellContent = value ? 'Yes' : 'No';
        } else if (columnId === 'hit_die') {
            cellContent = `${RPG_DICE[item.hitDie].name}`;
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
            <GenericList<ClassResponse>
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
                editHandler={(item) => navigate(`/admin/classes/${item.id}/edit`)}
                deleteHandler={(item) => HandleDeleteClass(item.id)}
                filterOptions={memoizedClassFilterOptions}
            />
        </div>
    );
}