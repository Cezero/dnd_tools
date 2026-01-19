import React from 'react';

import { FeaturesManager } from '@/components/feature-system/FeaturesManager';
import { FeatureSourceType, SpecialFeatureId } from '@shared/static-data';

import type { ClassTabProps } from './types';

export function FeaturesTab(props: ClassTabProps): React.JSX.Element {
    return (
        <FeaturesManager
            state={props.state}
            updateState={props.updateState}
            contextType={FeatureSourceType.Class}
            contextId={props.classId || props.state.classId || 0}
            parentType="class"
            title="Class Features"
            emptyMessage="No class features found"
            excludeSpecialFeatures={[SpecialFeatureId.ClassSkill, SpecialFeatureId.ClassProficiency]}
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
