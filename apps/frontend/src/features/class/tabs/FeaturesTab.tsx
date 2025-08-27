import React from 'react';

import { FeaturesTab as SharedFeaturesTab } from '@/components/feature-system/FeaturesTab';
import { FeatureSourceType, SpecialFeatureId } from '@shared/static-data';

import type { ClassTabProps } from './types';

export function FeaturesTab(props: ClassTabProps): React.JSX.Element {
    return (
        <SharedFeaturesTab
            {...props}
            contextType={FeatureSourceType.Class}
            contextId={props.classId || 0}
            title="Class Features"
            emptyMessage="No class features found"
            excludeSpecialFeatures={[SpecialFeatureId.ClassSkill, SpecialFeatureId.ClassProficiency]}
        />
    );
}
