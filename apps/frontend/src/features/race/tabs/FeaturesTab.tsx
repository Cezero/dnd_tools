import React from 'react';
import { SpecialFeatureId } from '@shared/static-data';
import { FeaturesTab as SharedFeaturesTab } from '@/components/feature-system/FeaturesTab';
import type { RaceTabProps } from './types';

export function FeaturesTab(props: RaceTabProps): React.JSX.Element {
    return (
        <SharedFeaturesTab
            {...props}
            contextType="race"
            contextId={props.raceId || 0}
            excludeSpecialFeatures={[
                SpecialFeatureId.AbilityAdjustment,
                SpecialFeatureId.AutomaticLanguage,
                SpecialFeatureId.BonusLanguage
            ]}
        />
    );
}
