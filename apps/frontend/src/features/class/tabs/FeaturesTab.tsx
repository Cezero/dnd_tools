import React from 'react';

import { SpecialFeatureId } from '@shared/static-data';

import { FeaturesTab as SharedFeaturesTab } from '@/components/feature-system/FeaturesTab';

import type { ClassTabProps } from './types';

export function FeaturesTab(props: ClassTabProps): React.JSX.Element {
    return (
        <SharedFeaturesTab
            {...props}
            contextType="class"
            contextId={props.classId || 0}
            excludeSpecialFeatures={[SpecialFeatureId.ClassSkill, SpecialFeatureId.ClassProficiency]}
        />
    );
}
