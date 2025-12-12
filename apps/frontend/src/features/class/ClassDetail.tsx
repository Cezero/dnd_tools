import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DnDClass, ClassVariant } from '@shared/schema';
import { isVariantId } from '@shared/utils';

import { ClassApi } from './ClassApi';
import { ClassDisplay } from './ClassDisplay';
import { VariantClassApi } from './VariantClassApi';

export default function ClassDetail() {
    const { id } = useParams();
    const [cls, setCls] = useState<DnDClass | null>(null);
    const [variantData, setVariantData] = useState<ClassVariant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                // Use unified API call - backend will determine if it's a variant from the ID
                const data = await ClassApi.getClassById(undefined, { id: parseInt(id!) });
                setCls(data);

                // If this is a variant class, also fetch the variant data for spell overrides
                if (isVariantId(parseInt(id!))) {
                    try {
                        const variant = await VariantClassApi.getVariantById(undefined, { id: parseInt(id!) });
                        setVariantData(variant);
                    } catch (variantError) {
                        console.error('Failed to fetch variant data:', variantError);
                        // Don't fail the whole component if variant data fails
                    }
                }

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
            variantData={variantData}
            showHeader={true}
            showActions={true}
            onBack={handleBack}
            onEdit={handleEdit}
            isAdmin={isAdmin}
            fromListParams={fromListParams}
        />
    );
}
