import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { FeatureEditForm } from '@/components/feature-system/FeatureEditForm';
import { Feature, FeatureWithRelations } from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

export function FeatureEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
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

    const handleSave = async (feature: Feature, features: FeatureWithRelations[]) => {
        const parentType = location.state?.parentType;
        const parentId = location.state?.parentId;

        if (parentType === 'class' && parentId) {
            await queryClient.invalidateQueries({
                queryKey: ['classes', 'item', parentId]
            });
            await queryClient.invalidateQueries({
                queryKey: ['classes'],
                exact: false
            });
        }
        if (parentType === 'race' && parentId) {
            await queryClient.invalidateQueries({
                queryKey: ['races', 'item', parentId]
            });
            await queryClient.invalidateQueries({
                queryKey: ['races'],
                exact: false
            });
        }
        if (parentType === 'feat' && parentId) {
            await queryClient.invalidateQueries({
                queryKey: ['feats', 'item', parentId]
            });
            await queryClient.invalidateQueries({
                queryKey: ['feats'],
                exact: false
            });
            await queryClient.invalidateQueries({
                queryKey: ['feats-cache'],
                exact: false
            });
        }

        setTimeout(() => {
            if (location.state?.from === 'ListSelectionDialog' && feature.id) {
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

    const featureIdNum = id === 'new' ? 'new' : (id ? parseInt(id) : 'new');

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
