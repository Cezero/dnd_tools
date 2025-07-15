import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { createIdDeleteServiceFunction, createSlugDeleteServiceFunction } from '@/components/generic-list/types';
import { CLASS_COLUMNS } from '@/features/admin/features/class-management/ClassColumns';
import { CLASS_FEATURE_COLUMNS } from '@/features/admin/features/class-management/ClassFeatureColumns';
import { ClassService } from '@/features/admin/features/class-management/ClassService';
import { ClassFeatureService } from '@/features/admin/features/class-management/ClassFeatureService';
import { ClassInQueryResponse, ClassFeatureSchema } from '@shared/schema';
import { routes, classFeatureRoutes } from './ClassConfig';

export default function ClassList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();

    const HandleNewClassClick = (): void => {
        navigate('/admin/classes/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleNewClassFeatureClick = (): void => {
        navigate('/admin/classes/features/new/edit', { state: { fromListParams: location.search } });
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
                    className="bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded"
                >
                    New Class
                </button>
            </div>
            <div id="classes-list-container">
                <GenericList<ClassInQueryResponse>
                    storageKey="classes-list"
                    columns={CLASS_COLUMNS}
                    serviceFunction={() => ClassService.getClasses({})}
                    itemDesc="class"
                    routes={routes}
                    deleteServiceFunction={createIdDeleteServiceFunction(ClassService.deleteClass)}
                    basePath="/admin"
                />
            </div>

            <h2 className="text-xl font-bold mb-4 mt-8">Class Feature Definitions</h2>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewClassFeatureClick}
                    className="bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded"
                >
                    New Class Feature
                </button>
            </div>
            <div id="class-features-list-container">
                <GenericList<z.infer<typeof ClassFeatureSchema>>
                    storageKey="class-features-list"
                    columns={CLASS_FEATURE_COLUMNS}
                    serviceFunction={() => ClassFeatureService.getClassFeatures({})}
                    itemDesc="class feature"
                    routes={classFeatureRoutes}
                    deleteServiceFunction={createSlugDeleteServiceFunction(ClassFeatureService.deleteClassFeature)}
                    basePath="/admin"
                />
            </div>
        </div>
    );
}
