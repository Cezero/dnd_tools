import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import type { OrphanedFeatureListItem } from '@shared/schema';

import { ORPHANED_FEATURE_COLUMNS } from './OrphanedFeaturesConfig';
import { OrphanedFeaturesApi } from './orphanedFeaturesApi';

export default function OrphanedFeaturesPage() {
    const navigate = useNavigate();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

    const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
    const [refreshNonce, setRefreshNonce] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    const dataFetcher = useCallback(async () => {
        return await OrphanedFeaturesApi.getOrphanedFeatures();
    }, []);

    const selectedFeatureIds = useMemo(() => selectedIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id)), [selectedIds]);

    const handleDeleteSelected = useCallback(async () => {
        if (selectedFeatureIds.length === 0 || isDeleting) {
            return;
        }

        setIsDeleting(true);
        try {
            await OrphanedFeaturesApi.deleteOrphanedFeatures(selectedFeatureIds);
            setSelectedIds([]);
            setRefreshNonce((n) => n + 1);
        } finally {
            setIsDeleting(false);
        }
    }, [isDeleting, selectedFeatureIds]);

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    if (!isAdmin) {
        return <div className="p-4">Access denied. Admin privileges required.</div>;
    }

    return (
        <div className="p-4">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <h1 className="text-2xl font-bold">Orphaned Features Cleanup</h1>
                    <p className="text-gray-600">
                        Orphaned features are not auto-deleted. Review and delete intentionally.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded"
                        onClick={() => navigate('/features')}
                    >
                        Back to Features
                    </button>
                    <button
                        type="button"
                        disabled={selectedFeatureIds.length === 0 || isDeleting}
                        className="bg-red-600 disabled:bg-red-300 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
                        onClick={handleDeleteSelected}
                    >
                        Delete Selected ({selectedFeatureIds.length})
                    </button>
                </div>
            </div>

            <GenericList<OrphanedFeatureListItem>
                key={refreshNonce}
                storageKey="orphaned-features-list"
                columns={ORPHANED_FEATURE_COLUMNS}
                dataFetcher={dataFetcher}
                itemDesc="orphaned feature"
                isOptionSelector
                selectedIds={selectedIds}
                onSelectedIdsChange={setSelectedIds}
            />
        </div>
    );
}

