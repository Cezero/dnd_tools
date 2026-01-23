import React from 'react';

import { FeaturesManager } from '@/components/feature-system/FeaturesManager';
import { FeatureSourceType } from '@shared/static-data';

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
            onLinkFeatureId={props.onLinkFeatureId}
            onUnlinkFeatureId={props.onUnlinkFeatureId}
        />
    );
}
