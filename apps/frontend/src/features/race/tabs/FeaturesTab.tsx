import React from 'react';

import { FeaturesManager } from '@/components/feature-system/FeaturesManager';
import { FeatureSourceType } from '@shared/static-data';

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
            onLinkFeatureId={props.onLinkFeatureId}
            onUnlinkFeatureId={props.onUnlinkFeatureId}
        />
    );
}
