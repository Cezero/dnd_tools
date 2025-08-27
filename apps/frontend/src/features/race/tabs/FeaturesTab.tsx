import React from 'react';

import { FeaturesTab as SharedFeaturesTab } from '@/components/feature-system/FeaturesTab';
import { FeatureSourceType, SpecialFeatureId } from '@shared/static-data';

import type { RaceTabProps } from './types';

export function FeaturesTab(props: RaceTabProps): React.JSX.Element {
    return (
        <SharedFeaturesTab
            {...props}
            contextType={FeatureSourceType.Race}
            contextId={props.raceId || 0}
            title="Race Features"
            emptyMessage="No race features found"
            excludeSpecialFeatures={[
                SpecialFeatureId.AbilityAdjustment,
                SpecialFeatureId.AutomaticLanguage,
                SpecialFeatureId.BonusLanguage
            ]}
        />
    );
}
