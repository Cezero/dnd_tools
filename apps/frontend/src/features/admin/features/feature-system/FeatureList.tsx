import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { FeatureQueryHooks } from '@/components/feature-system/FeatureQueryHooks';
import { GenericList } from '@/components/generic-list/GenericList';
import { createIdDeleteServiceFunction } from '@/components/generic-list/types';
import { Feature } from '@shared/schema';

import { FEATURE_COLUMNS, routes } from './FeatureConfig';

export default function FeatureList() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

    const handleNewFeatureClick = (): void => {
        navigate('/features/new/edit', { state: { fromListParams: location.search } });
    };

    const handleOrphanedFeaturesClick = (): void => {
        navigate('/features/orphaned');
    };

    const dataFetcher = useCallback(async () => {
        return await FeatureQueryHooks.getFeatures({});
    }, []);

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Feature Management</h1>
            <p className="text-gray-600 mb-4">
                Manage standalone features for classes, races, and other game elements
            </p>
            {isAdmin && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={handleOrphanedFeaturesClick}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                    >
                        Orphaned Cleanup
                    </button>
                    <button
                        onClick={handleNewFeatureClick}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        New Feature
                    </button>
                </div>
            )}
            <GenericList<Feature>
                storageKey="features-list"
                columns={FEATURE_COLUMNS}
                dataFetcher={dataFetcher}
                itemDesc="feature"
                routes={routes}
                deleteServiceFunction={createIdDeleteServiceFunction((_, { id }) => FeatureQueryHooks.deleteFeature(id))}
            />
        </div>
    );
}
