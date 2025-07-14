import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { CLASS_COLUMNS } from '@/features/admin/features/class-management/ClassColumns';
import { CLASS_FEATURE_COLUMNS } from '@/features/admin/features/class-management/ClassFeatureColumns';
import { ClassService } from '@/features/admin/features/class-management/ClassService';
import { ClassFeatureService } from '@/features/admin/features/class-management/ClassFeatureService';
import { ClassInQueryResponse, ClassFeatureSchema } from '@shared/schema';
import { routes } from './ClassConfig';

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

    const HandleDeleteClass = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this class?')) {
            try {
                await ClassService.deleteClass(undefined, { id });
            } catch (error) {
                console.error('Failed to delete class:', error);
                alert('Failed to delete class.');
            }
        }
    };

    const HandleDeleteClassFeature = async (slug: string): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this class feature?')) {
            try {
                await ClassFeatureService.deleteClassFeature(undefined, { slug });
            } catch (error) {
                console.error('Failed to delete class feature:', error);
                alert('Failed to delete class feature.');
            }
        }
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
            <GenericList<ClassInQueryResponse>
                storageKey="classes-list"
                columns={CLASS_COLUMNS}
                serviceFunction={() => ClassService.getClasses({})}
                itemDesc="class"
                routes={routes}
            />

            <h2 className="text-xl font-bold mb-4 mt-8">Class Feature Definitions</h2>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewClassFeatureClick}
                    className="bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded"
                >
                    New Class Feature
                </button>
            </div>
            <GenericList<z.infer<typeof ClassFeatureSchema>>
                storageKey="class-features-list"
                columns={CLASS_FEATURE_COLUMNS}
                serviceFunction={() => ClassFeatureService.getClassFeatures({})}
                itemDesc="class feature"
                routes={routes}
            />
        </div>
    );
}
