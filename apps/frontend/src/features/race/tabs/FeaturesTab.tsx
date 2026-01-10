import React from 'react';

import { FeaturesManager } from '@/components/feature-system/FeaturesManager';
import { FeatureSourceType, SpecialFeatureId } from '@shared/static-data';

import type { RaceTabProps } from './types';

export function FeaturesTab(props: RaceTabProps): React.JSX.Element {
    return (
        <FeaturesManager
            {...props}
            contextType={FeatureSourceType.Race}
            contextId={props.raceId || 0}
            parentType="race"
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
