import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { FeatureDetail, FeatureEdit } from '@/components/feature-system';
import { FeatureSystemApi } from '@/components/feature-system/FeatureSystemApi';
import { GenericList } from '@/components/generic-list/GenericList';
import { createIdDeleteServiceFunction } from '@/components/generic-list/types';
import { ClassSummary, Feature } from '@shared/schema';

import { ClassApi } from './ClassApi';
import { CLASS_COLUMNS } from './ClassColumns';
import { routes } from './ClassConfig';
import { FEATURE_COLUMNS } from './FeatureColumns';

export default function ClassList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

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
                    serviceFunction={() => ClassApi.getClasses({})}
                    itemDesc="class"
                    routes={routes}
                    deleteServiceFunction={createIdDeleteServiceFunction(ClassApi.deleteClass)}
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
                            serviceFunction={() => FeatureSystemApi.getFeatures({ sourceType: 1 })}
                            itemDesc="feature"
                            routes={[
                                { path: 'features/:id', component: FeatureDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
                                { path: 'features/:id/edit', component: FeatureEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
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
                                delete: async (feature) => {
                                    try {
                                        await FeatureSystemApi.deleteFeature(undefined, { id: feature.id });
                                        // The GenericList will handle refreshing the data
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
