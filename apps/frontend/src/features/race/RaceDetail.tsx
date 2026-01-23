import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';

import { RaceDisplay } from './RaceDisplay';
import { RaceQueryHooks } from './RaceQueryHooks';


export function RaceDetail() {
    const { id } = useParams();
    const { isAdmin, user } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    const raceId = id ? parseInt(id) : null;

    // Fetch race data using TanStack Query (from database)
    const { data: race, isLoading, error } = useQuery({
        queryKey: RaceQueryHooks.getRaceByIdQueryKey(raceId!),
        queryFn: () => RaceQueryHooks.getRaceById(raceId!),
        enabled: !!raceId,
    });

    // Fetch feature progressions for this race (resolves featureIds to FeatureWithRelations[])
    const { data: features = [] } = useQuery({
        queryKey: RaceQueryHooks.getRaceFeaturesQueryKey(raceId!),
        queryFn: () => RaceQueryHooks.getRaceFeatures(raceId!),
        enabled: !!raceId,
    });

    // Fetch lock status (only for admin users)
    const { data: lockStatus } = useQuery({
        queryKey: RaceQueryHooks.getRaceLockStatusQueryKey(raceId!),
        queryFn: () => RaceQueryHooks.getRaceLockStatus(raceId!),
        enabled: !!raceId && isAdmin,
    });

    const handleBack = () => {
        navigate(`/races${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/races/${id}/edit`, { state: { fromListParams: fromListParams } });
    };

    if (isLoading) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    Loading...
                </div>
            </div>
        </div>
    );

    if (error || !race) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    {error ? 'Error loading race' : 'Race not found'}
                </div>
            </div>
        </div>
    );

    return (
        <RaceDisplay
            race={race}
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
