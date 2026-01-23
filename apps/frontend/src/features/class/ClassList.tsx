import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { FeatureQueryHooks } from '@/components/feature-system/FeatureQueryHooks';
import { GenericList } from '@/components/generic-list';
import { ClassSummary, Feature } from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

import { CLASS_COLUMNS } from './ClassColumns';
import { ClassQueryHooks } from './ClassQueryHooks';
import { FEATURE_COLUMNS } from './FeatureColumns';

export default function ClassList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();
    // Use imperative API for feature deletion

    const HandleNewClassClick = (): void => {
        navigate('/classes/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleNewFeatureClick = (): void => {
        navigate('/features/new/edit', {
            state: {
                fromListParams: location.search,
                fromPage: 'classes'
            }
        });
    };

    const classesDataFetcher = useCallback(async () => {
        return await ClassQueryHooks.getClasses({});
    }, []);

    const featuresDataFetcher = useCallback(async () => {
        return await FeatureQueryHooks.getFeatures({ sourceTypes: [FeatureSourceType.Class] });
    }, []);

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Classes</h1>
            {isAdmin && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={HandleNewClassClick}
                        className="bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded"
                    >
                        New Class
                    </button>
                </div>
            )}
            <div id="classes-list-container">
                <GenericList<ClassSummary>
                    storageKey="classes-list"
                    columns={CLASS_COLUMNS}
                    dataFetcher={classesDataFetcher}
                    itemDesc="class"
                    routes={[
                        { path: 'classes/:id', component: null, routeType: 'detail' },
                        { path: 'classes/:id/edit', component: null, routeType: 'edit' },
                        { path: 'classes/new/edit', component: null, routeType: 'edit' }
                    ]}
                    functions={{
                        edit: (item) => {
                            navigate(`/classes/${item.id}/edit`, {
                                state: {
                                    fromListParams: location.search
                                }
                            });
                        },
                        detail: (item) => {
                            navigate(`/classes/${item.id}`, {
                                state: {
                                    fromListParams: location.search
                                }
                            });
                        },
                        delete: async (item) => {
                            // Use canonical QueryHooks for all classes
                            try {
                                await ClassQueryHooks.deleteClass(item.id);
                                // The QueryBasedList will handle refreshing the data
                            } catch (error) {
                                console.error('Failed to delete class:', error);
                                alert('Failed to delete class.');
                            }
                        }
                    }}
                />
            </div>

            {isAdmin && (
                <>
                    <h2 className="text-xl font-bold mb-4 mt-8">Feature Definitions</h2>
                    <div className="mb-4 flex justify-end">
                        <button
                            onClick={HandleNewFeatureClick}
                            className="bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded"
                        >
                            New Feature
                        </button>
                    </div>
                    <div id="features-list-container">
                        <GenericList<Feature>
                            storageKey="features-list"
                            columns={FEATURE_COLUMNS}
                            dataFetcher={featuresDataFetcher}
                            itemDesc="feature"
                            routes={[
                                { path: 'features/:id', component: null, routeType: 'detail' },
                                { path: 'features/:id/edit', component: null, routeType: 'edit' },
                                { path: 'features/new/edit', component: null, routeType: 'edit' }
                            ]}
                            functions={{
                                edit: (feature) => {
                                    navigate(`/features/${feature.id}/edit`, {
                                        state: {
                                            fromListParams: location.search,
                                            fromPage: 'classes'
                                        }
                                    });
                                },
                                detail: (feature) => {
                                    navigate(`/features/${feature.id}`, {
                                        state: {
                                            fromListParams: location.search,
                                            fromPage: 'classes'
                                        }
                                    });
                                },
                                delete: async (feature) => {
                                    try {
                                        await FeatureQueryHooks.deleteFeature(feature.id);
                                    } catch (error) {
                                        console.error('Failed to delete feature:', error);
                                        alert('Failed to delete feature.');
                                    }
                                }
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
