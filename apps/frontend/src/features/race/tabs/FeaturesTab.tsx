import React from 'react';

import { FeaturesManager } from '@/components/feature-system/FeaturesManager';
import { FeatureSourceType, SpecialFeatureId } from '@shared/static-data';

import type { RaceTabProps } from './types';

export function FeaturesTab(props: RaceTabProps): React.JSX.Element {
    return (
        <FeaturesManager
            state={props.state}
            updateState={props.updateState}
            contextType={FeatureSourceType.Race}
            contextId={props.raceId || props.state.raceId || 0}
            parentType="race"
            title="Race Features"
            emptyMessage="No race features found"
            excludeSpecialFeatures={[
                SpecialFeatureId.AbilityAdjustment,
                SpecialFeatureId.AutomaticLanguage,
                SpecialFeatureId.BonusLanguage
            ]}
            // Legacy props for backward compatibility (not needed when using state-based pattern)
            featureProgressions={props.featureProgressions}
            onEditProgression={props.onEditProgression}
            onRemoveProgression={props.onRemoveProgression}
            onAddFeature={props.onAddFeature}
            setEditingProgression={props.setEditingProgression}
            setPreSelectedFeature={props.setPreSelectedFeature}
            setIsProgressionDialogOpen={props.setIsProgressionDialogOpen}
        />
    );
}
