import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import { useAuthAuto } from '@/components/auth';
import { FeatureDetail, FeatureEdit } from '@/components/feature-system';
import { GenericList } from '@/components/generic-list/GenericList';
import { createIdDeleteServiceFunction, createSlugDeleteServiceFunction } from '@/components/generic-list/types';
import { FeatureSystemService } from '@/services/FeatureSystemService';
import { ClassInQueryResponse, FeatureSchema } from '@shared/schema';

import { CLASS_COLUMNS } from './ClassColumns';
import { routes } from './ClassConfig';
import { ClassService } from './ClassService';
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
                <GenericList<ClassInQueryResponse>
                    storageKey="classes-list"
                    columns={CLASS_COLUMNS}
                    serviceFunction={() => ClassService.getClasses({})}
                    itemDesc="class"
                    routes={routes}
                    deleteServiceFunction={createIdDeleteServiceFunction(ClassService.deleteClass)}
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
                        <GenericList<z.infer<typeof FeatureSchema>>
                            storageKey="features-list"
                            columns={FEATURE_COLUMNS}
                            serviceFunction={() => FeatureSystemService.getFeatures({ sourceType: 1 })}
                            itemDesc="feature"
                            routes={[
                                { path: 'features/:slug', component: FeatureDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
                                { path: 'features/:slug/edit', component: FeatureEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
                            ]}
                            deleteServiceFunction={createSlugDeleteServiceFunction(FeatureSystemService.deleteFeature)}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
