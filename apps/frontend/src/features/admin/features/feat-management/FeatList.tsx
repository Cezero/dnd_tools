import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { COLUMN_DEFINITIONS } from '@/features/admin/features/feat-management/FeatConfig';
import { FeatService } from '@/features/admin/features/feat-management/FeatService';
import { FeatQuerySchema, FeatResponse } from '@shared/schema';
import { FEAT_TYPES } from '@shared/static-data';

export function FeatList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    const HandleNewFeatClick = (): void => {
        navigate('/admin/feats/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteFeat = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this feat?')) {
            try {
                await FeatService.deleteFeat(undefined, { id });
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete feat:', error);
                alert('Failed to delete feat.');
            }
        }
    };

    const RenderCell = (item: FeatResponse, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = String(item[columnId as keyof FeatResponse] || '');

        if (columnId === 'name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/feats/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item.name}
                </a>
            );
        } else if (columnId === 'typeId') {
            cellContent = FEAT_TYPES[item.typeId]?.name || item.typeId;
        } else if (columnId === 'repeatable') {
            cellContent = item.repeatable ? 'Yes' : 'No';
        } else if (['description', 'benefit', 'normalEffect', 'specialEffect', 'prerequisites'].includes(columnId)) {
            const fieldMap = {
                'description': item.description,
                'benefit': item.benefit,
                'normalEffect': item.normalEffect,
                'specialEffect': item.specialEffect,
                'prerequisites': item.prerequisites,
            };
            cellContent = (<ProcessMarkdown markdown={String(fieldMap[columnId as keyof typeof fieldMap] || '')} />);
        }

        return cellContent;
    };

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Feats</h1>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewFeatClick}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    New Feat
                </button>
            </div>
            <GenericList<FeatResponse>
                storageKey="feats-list"
                columnDefinitions={COLUMN_DEFINITIONS}
                querySchema={FeatQuerySchema}
                serviceFunction={FeatService.getFeats}
                renderCell={RenderCell}
                detailPagePath="/admin/feats/:id"
                idKey="id"
                itemDesc="feat"
                editHandler={(item) => navigate(`/admin/feats/${item.id}/edit`)}
                deleteHandler={(item) => HandleDeleteFeat(item.id)}
            />
        </div>
    );
} 