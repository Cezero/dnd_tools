import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GetClassResponse } from '@shared/schema';

import { ClassDisplay } from './ClassDisplay';
import { ClassService } from './ClassService';

export default function ClassDetail() {
    const { id } = useParams();
    const [cls, setCls] = useState<GetClassResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await ClassService.getClassById(undefined, { id: parseInt(id!) });
                setCls(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch class:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [id, location.state]);

    const handleBack = () => {
        navigate(`/classes${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/classes/${id}/edit`, { state: { fromListParams: fromListParams } });
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

    if (!cls) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    Class not found
                </div>
            </div>
        </div>
    );

    return (
        <ClassDisplay
            cls={cls}
            showHeader={true}
            showActions={true}
            onBack={handleBack}
            onEdit={handleEdit}
            isAdmin={isAdmin}
            fromListParams={fromListParams}
        />
    );
}
