import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GenericList } from '@/components/generic-list/GenericList';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS, FeatFilterOptions } from '@/features/admin/features/feat-management/FeatConfig';
import { FetchFeats, DeleteFeat } from '@/features/admin/features/feat-management/FeatService';
import { UseAuth } from '@/components/auth/AuthProvider';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { FEAT_TYPES } from '@shared/static-data';
import { Prisma } from '@shared/prisma-client';

// Use Prisma type for feat items
type FeatItem = Prisma.FeatGetPayload<Record<string, never>>;

// Type for processed feat data that matches the column definitions
type ProcessedFeatItem = {
    feat_name: string;
    feat_type: number;
    feat_description: string | null;
    feat_benefit: string | null;
    feat_normal: string | null;
    feat_special: string | null;
    feat_prereq: string | null;
    feat_multi_times: boolean | null;
    id: number;
};

export function FeatList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoading: isAuthLoading } = UseAuth();
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    const memoizedFeatFilterOptions = useMemo(() => (
        FeatFilterOptions()
    ), []);

    const FeatFetchData = useCallback(async (params: URLSearchParams) => {
        const { data, total } = await FetchFeats(params);
        const processedResults: ProcessedFeatItem[] = data.map((feat: FeatItem) => ({
            feat_name: feat.name,
            feat_type: feat.typeId,
            feat_description: feat.description,
            feat_benefit: feat.benefit,
            feat_normal: feat.normalEffect,
            feat_special: feat.specialEffect,
            feat_prereq: feat.prerequisites,
            feat_multi_times: feat.repeatable,
            id: feat.id
        }));
        return { data: processedResults, total: total };
    }, [user]);

    const HandleNewFeatClick = (): void => {
        navigate('/admin/feats/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteFeat = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this feat?')) {
            try {
                await DeleteFeat(id);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete feat:', error);
                alert('Failed to delete feat.');
            }
        }
    };

    const RenderCell = (item: ProcessedFeatItem, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = String(item[columnId as keyof ProcessedFeatItem] || '');

        if (columnId === 'feat_name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/feats/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item.feat_name}
                </a>
            );
        } else if (columnId === 'feat_type') {
            cellContent = FEAT_TYPES[item.feat_type]?.name || item.feat_type;
        } else if (columnId === 'feat_multi_times') {
            cellContent = item.feat_multi_times ? 'Yes' : 'No';
        } else if (['feat_description', 'feat_benefit', 'feat_normal', 'feat_special', 'feat_prereq'].includes(columnId)) {
            cellContent = (<ProcessMarkdown markdown={String(item[columnId as keyof ProcessedFeatItem] || '')} />);
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
            <GenericList<ProcessedFeatItem>
                storageKey="feats-list"
                defaultColumns={DEFAULT_COLUMNS}
                requiredColumnId="feat_name"
                columnDefinitions={COLUMN_DEFINITIONS}
                fetchData={FeatFetchData}
                renderCell={RenderCell}
                detailPagePath="/admin/feats/:id"
                idKey="id"
                itemDesc="feat"
                editHandler={(item: ProcessedFeatItem) => navigate(`/admin/feats/${item.id}/edit`)}
                deleteHandler={(item: ProcessedFeatItem) => HandleDeleteFeat(item.id)}
                filterOptions={memoizedFeatFilterOptions}
            />
        </div>
    );
} 