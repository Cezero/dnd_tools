import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list';
import { COLUMN_DEFINITIONS } from '@/features/admin/features/class-management/ClassConfig';
import { ClassService } from '@/features/admin/features/class-management/ClassService';
import { ClassQuerySchema, ClassInQueryResponse } from '@shared/schema';
import { RPG_DICE, EDITION_MAP, ABILITY_MAP, GetSourceDisplay } from '@shared/static-data';

export default function ClassList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();

    const HandleNewClassClick = (): void => {
        navigate('/admin/classes/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteClass = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this class?')) {
            try {
                await ClassService.deleteClass(undefined, { id });
            } catch (error) {
                console.error('Failed to delete class:', error);
                alert('Failed to delete class.');
            }
        }
    };

    const RenderCell = (item: ClassInQueryResponse, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = String(item[columnId as keyof ClassInQueryResponse] || '');

        if (columnId === 'name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/classes/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item.name}
                </a>
            );
        } else if (columnId === 'editionId') {
            cellContent = EDITION_MAP[item.editionId]?.abbreviation;
        } else if (columnId === 'isPrestige' || columnId === 'isVisible' || columnId === 'canCastSpells') {
            const value = columnId === 'isPrestige' ? item.isPrestige :
                columnId === 'isVisible' ? item.isVisible :
                    item.canCastSpells;
            cellContent = value ? 'Yes' : 'No';
        } else if (columnId === 'hitDie') {
            cellContent = `${RPG_DICE[item.hitDie]?.name || 'Unknown'}`;
        } else if (columnId === 'castingAbilityId') {
            cellContent = item.castingAbilityId ? ABILITY_MAP[item.castingAbilityId]?.name || 'Unknown' : 'None';
        } else if (columnId === 'sourceId') {
            if (item.sourceBookInfo && item.sourceBookInfo.length > 0) {
                cellContent = GetSourceDisplay(item.sourceBookInfo.map(s => ({ bookId: s.sourceBookId, pageNumber: s.pageNumber })), true);
            } else {
                cellContent = '';
            }
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
            <GenericList<ClassInQueryResponse>
                storageKey="classes-list"
                columnDefinitions={COLUMN_DEFINITIONS}
                querySchema={ClassQuerySchema}
                serviceFunction={ClassService.getClasses}
                renderCell={RenderCell}
                detailPagePath="/admin/classes/:id"
                itemDesc="class"
                editHandler={(item) => navigate(`/admin/classes/${item.id}/edit`)}
                deleteHandler={(item) => HandleDeleteClass(item.id)}
            />
        </div>
    );
}