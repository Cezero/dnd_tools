import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { usePrecacheFeatureEntities } from '@/lib/formatters/hooks/usePrecacheFeatureEntities';

import { ClassDisplay } from './ClassDisplay';
import { ClassQueryHooks } from './ClassQueryHooks';

export default function ClassDetail() {
    const { id } = useParams();
    const { isAdmin, user } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    const classId = id ? parseInt(id) : null;

    // Fetch class data using TanStack Query (from database)
    const { data: cls, isLoading, error } = useQuery({
        queryKey: ClassQueryHooks.getClassByIdQueryKey(classId!),
        queryFn: () => ClassQueryHooks.getClassById(classId!),
        enabled: !!classId,
    });

    // Fetch feature progressions for this class (resolves featureIds to FeatureWithRelations[])
    const { data: features = [] } = useQuery({
        queryKey: ClassQueryHooks.getClassFeaturesQueryKey(classId!),
        queryFn: () => ClassQueryHooks.getClassFeatures(classId!),
        enabled: !!classId,
    });

    // Fetch lock status (only for admin users)
    const { data: lockStatus } = useQuery({
        queryKey: ClassQueryHooks.getClassLockStatusQueryKey(classId!),
        queryFn: () => ClassQueryHooks.getClassLockStatus(classId!),
        enabled: !!classId && isAdmin,
    });

    // Precache all entities referenced in feature features
    const { isPrecaching: isPrecachingEntities } = usePrecacheFeatureEntities(features);

    const handleBack = () => {
        navigate(`/classes${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/classes/${id}/edit`, { state: { fromListParams: fromListParams } });
    };

    if (isLoading || isPrecachingEntities) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    Loading...
                </div>
            </div>
        </div>
    );

    if (error || !cls) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    {error ? 'Error loading class' : 'Class not found'}
                </div>
            </div>
        </div>
    );

    return (
        <ClassDisplay
            cls={cls}
            features={features}
            showHeader={true}
            showActions={true}
            onBack={handleBack}
            onEdit={handleEdit}
            isAdmin={isAdmin}
            fromListParams={fromListParams}
            lockStatus={lockStatus}
            currentUserId={user?.id}
        />
    );
}
