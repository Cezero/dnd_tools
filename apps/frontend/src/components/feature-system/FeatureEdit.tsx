import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { FeatureEditForm } from '@/components/feature-system/FeatureEditForm';
import { FeatureQueryHooks } from '@/components/feature-system/FeatureQueryHooks';
import { Feature, FeatureWithRelations } from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

export function FeatureEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';
    const fromPage = location.state?.fromPage || 'features';

    const getBackLink = () => {
        if (location.state?.from === 'ListSelectionDialog') {
            return location.state.returnPath;
        }

        const parentType = location.state?.parentType;
        const parentId = location.state?.parentId;

        if (parentType === 'class' && parentId) {
            return `/classes/${parentId}/edit`;
        }

        if (parentType === 'race' && parentId) {
            return `/races/${parentId}/edit`;
        }

        if (parentType === 'feat' && parentId) {
            return `/feats/${parentId}/edit`;
        }

        switch (fromPage) {
            case 'classes':
                return fromListParams ? `/classes?${fromListParams}` : '/classes';
            case 'races':
                return fromListParams ? `/races?${fromListParams}` : '/races';
            case 'feats':
                return fromListParams ? `/feats?${fromListParams}` : '/feats';
            default:
                return fromListParams ? `/features?${fromListParams}` : '/features';
        }
    };

    const handleSave = async (featureId: number) => {
        setTimeout(async () => {
            if (location.state?.from === 'ListSelectionDialog' && featureId) {
                // Fetch feature data if needed for navigation state
                const feature = await FeatureQueryHooks.getFeatureById(featureId);
                if (feature) {
                    navigate(location.state.returnPath, {
                        state: {
                            newFeature: {
                                featureId: feature.id,
                                name: feature.name,
                                description: feature.description,
                                slug: feature.slug,
                                level: 1
                            }
                        }
                    });
                } else {
                    navigate(location.state.returnPath);
                }
            } else {
                navigate(getBackLink());
            }
        }, 1000);
    };

    const handleCancel = () => {
        navigate(getBackLink());
    };

    const parentType = location.state?.parentType;
    const parentId = location.state?.parentId;

    let context;
    if (parentType && parentId) {
        const sourceTypeMap: Record<string, FeatureSourceType> = {
            class: FeatureSourceType.Class,
            race: FeatureSourceType.Race,
            domain: FeatureSourceType.Domain,
            feat: FeatureSourceType.Feat
        };

        context = {
            sourceType: sourceTypeMap[parentType] || FeatureSourceType.None,
            parentId: parentId,
            parentType: parentType as 'class' | 'race' | 'domain' | 'feat'
        };
    }

    const featureIdNum = id === 'new' || id === '0' ? 0 : (id ? parseInt(id) : 0);

    return (
        <FeatureEditForm
            featureId={featureIdNum}
            mode="embedded"
            onSave={handleSave}
            onCancel={handleCancel}
            context={context}
            showHeader={true}
        />
    );
}
