import React from 'react';

import { FeaturesManager } from '@/components/feature-system/FeaturesManager';
import { FeatureSourceType, SpecialFeatureId } from '@shared/static-data';

import type { ClassTabProps } from './types';

export function FeaturesTab(props: ClassTabProps): React.JSX.Element {
    return (
        <FeaturesManager
            {...props}
            contextType={FeatureSourceType.Class}
            contextId={props.classId || 0}
            parentType="class"
            title="Class Features"
            emptyMessage="No class features found"
            excludeSpecialFeatures={[SpecialFeatureId.ClassSkill, SpecialFeatureId.ClassProficiency]}
        />
    );
}
