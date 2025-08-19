import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GetRaceResponse } from '@shared/schema';

import { RaceDisplay } from './RaceDisplay';
import { RaceService } from './RaceService';

export function RaceDetail() {
    const { id } = useParams();
    const [race, setRace] = useState<GetRaceResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await RaceService.getRaceById(undefined, { id: parseInt(id!) });
                setRace(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch race:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [id, location.state]);

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

    if (!race) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    Race not found
                </div>
            </div>
        </div>
    );

    return (
        <RaceDisplay
            race={race}
            showHeader={true}
            showActions={true}
            onBack={handleBack}
            onEdit={handleEdit}
            isAdmin={isAdmin}
            fromListParams={fromListParams}
        />
    );
}
