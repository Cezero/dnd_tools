import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { COLUMN_DEFINITIONS } from '@/features/spell/SpellConfig';
import { SpellService } from '@/features/spell/SpellService';
import { SpellInQueryResponse, SpellQuerySchema } from '@shared/schema';
import { SpellSchoolNameList, SpellDescriptorNameList, SpellComponentAbbrList, GetSourceDisplay } from '@shared/static-data';

import { GetClassDisplay } from './spellUtil';

export function SpellList(): React.JSX.Element {
    const navigate = useNavigate();
    const { isLoading: isAuthLoading } = useAuthAuto();

    const HandleDeleteSpell = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this spell?')) {
            try {
                await SpellService.deleteSpell(undefined, { id });
                // Refresh the list by navigating to the same page
                navigate('/spells', { replace: true });
            } catch (error) {
                console.error('Failed to delete spell:', error);
                alert('Failed to delete spell.');
            }
        }
    };

    const RenderCell = (item: SpellInQueryResponse, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = String(item[columnId as keyof SpellInQueryResponse] || '');

        if (columnId === 'name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/spells/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item.name}
                </a>
            );
        } else if (columnId === 'spellLevel') {
            cellContent = item.baseLevel !== undefined ? item.baseLevel.toString() : '';
        } else if (columnId === 'schoolId') {
            cellContent = item.schoolIds ? SpellSchoolNameList(item.schoolIds.map(s => s.schoolId)) : '';
        } else if (columnId === 'descriptorId') {
            cellContent = item.descriptorIds ? SpellDescriptorNameList(item.descriptorIds.map(d => d.descriptorId)) : '';
        } else if (columnId === 'componentId') {
            cellContent = item.componentIds ? SpellComponentAbbrList(item.componentIds.map(c => c.componentId)) : '';
        } else if (columnId === 'sourceId') {
            if (item.sourceBookInfo && item.sourceBookInfo.length > 0) {
                cellContent = GetSourceDisplay(item.sourceBookInfo.map(s => ({ bookId: s.sourceBookId, pageNumber: s.pageNumber })), true);
            } else {
                cellContent = '';
            }
        } else if (columnId === 'classId') {
            // Handle class level mappings using GetClassDisplay
            if (item.levelMapping && item.levelMapping.length > 0) {
                cellContent = GetClassDisplay(item.levelMapping, item.baseLevel);
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
            <h1 className="text-2xl font-bold mb-4">Spells</h1>
            <GenericList<SpellInQueryResponse>
                storageKey="spells-list"
                columnDefinitions={COLUMN_DEFINITIONS}
                querySchema={SpellQuerySchema}
                serviceFunction={SpellService.getSpells}
                renderCell={RenderCell}
                detailPagePath="/spells/:id"
                idKey="id"
                itemDesc="spell"
                editHandler={(item: SpellInQueryResponse) => navigate(`/spells/${item.id}/edit`)}
                deleteHandler={(item: SpellInQueryResponse) => HandleDeleteSpell(item.id)}
            />
        </div>
    );
} 