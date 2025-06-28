import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GenericList } from '@/components/GenericList/GenericList';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS, FeatFilterOptions } from '@/features/admin/features/featMgmt/config/FeatConfig';
import { FetchFeats, DeleteFeat } from '@/features/admin/features/featMgmt/services/FeatService';
import { UseAuth } from '@/auth/AuthProvider';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { FEAT_TYPES } from '@shared/static-data';

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
        const processedResults = data.map((feat: any) => ({
            feat_name: feat.feat_name,
            feat_type: feat.feat_type,
            feat_description: feat.feat_description,
            feat_benefit: feat.feat_benefit,
            feat_normal: feat.feat_normal,
            feat_special: feat.feat_special,
            feat_prereq: feat.feat_prereq,
            feat_multi_times: feat.feat_multi_times,
            id: feat.feat_id
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

    const RenderCell = (item: any, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = item[columnId];

        if (columnId === 'feat_name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/feats/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item[columnId]}
                </a>
            );
        } else if (columnId === 'feat_type') {
            cellContent = FEAT_TYPES[item[columnId]]?.name || item[columnId];
        } else if (columnId === 'feat_multi_times') {
            cellContent = item[columnId] ? 'Yes' : 'No';
        } else if (['feat_description', 'feat_benefit', 'feat_normal', 'feat_special', 'feat_prereq'].includes(columnId)) {
            cellContent = (<ProcessMarkdown markdown={item[columnId]} />);
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
            <GenericList
                storageKey="feats-list"
                defaultColumns={DEFAULT_COLUMNS}
                requiredColumnId="feat_name"
                columnDefinitions={COLUMN_DEFINITIONS}
                fetchData={FeatFetchData}
                renderCell={RenderCell}
                detailPagePath="/admin/feats/:id"
                idKey="id"
                refreshTrigger={refreshTrigger}
                itemDesc="feat"
                editHandler={(item: any) => navigate(`/admin/feats/${item.id}/edit`)}
                deleteHandler={(item: any) => HandleDeleteFeat(item.id)}
                filterOptions={memoizedFeatFilterOptions}
            />
        </div>
    );
} 