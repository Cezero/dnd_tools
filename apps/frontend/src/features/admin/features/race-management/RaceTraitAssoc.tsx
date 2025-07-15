import React from 'react';
import { z } from 'zod';

import { ItemAssoc } from '@/features/admin/lib/ItemAssoc';
import { RaceTraitService } from '@/features/admin/features/race-management/RaceTraitService';
import { RaceTraitSchema } from '@shared/schema';

type RaceTraitItem = z.infer<typeof RaceTraitSchema>;

type SelectedTraitData = {
    slug: string;
    description: string;
    hasValue: boolean;
    value: string;
};

// Props interface for RaceTraitAssoc component
interface RaceTraitAssocProps {
    /** Whether the dialog is open */
    isOpen: boolean;
    /** Function to call when the dialog is closed */
    onClose: () => void;
    /** Function to call with the selected trait data when a trait is chosen */
    onSave: (traits: SelectedTraitData[]) => void;
    /** Array of trait slugs already associated with the race */
    initialSelectedTraitIds: string[];
    /** The ID of the race currently being edited, used for returning to the correct RaceEdit page */
    raceId?: number;
}

/**
 * Component for associating race traits with a race. This dialog allows selecting existing traits
 * from a list to associate them with a race. When traits are selected, the dialog closes and the
 * selected traits' information is passed to the `onSave` handler.
 */
export function RaceTraitAssoc({ isOpen, onClose, onSave, initialSelectedTraitIds = [], raceId }: RaceTraitAssocProps) {
    const transformSelectedTraits = (traits: RaceTraitItem[]): SelectedTraitData[] => {
        return traits.map(trait => ({
            slug: trait.slug,
            description: trait.description,
            hasValue: trait.hasValue,
            value: trait.hasValue ? '' : '',
        }));
    };

    const getMarkdownId = (trait: RaceTraitItem): string => {
        return `race-trait-${trait.slug}-description`;
    };

    return (
        <ItemAssoc<RaceTraitItem, SelectedTraitData>
            isOpen={isOpen}
            onClose={onClose}
            onSave={onSave}
            initialSelectedIds={initialSelectedTraitIds}
            parentId={raceId}
            serviceFunction={async () => {
                const response = await RaceTraitService.getRaceTraits({});
                return response;
            }}
            storageKey="raceTraitSelectionList"
            itemDesc="trait"
            createNewRoute="/admin/races/traits/new/edit"
            transformSelectedItems={transformSelectedTraits}
            getMarkdownId={getMarkdownId}
            dialogTitle="Select Race Trait(s)"
            createNewButtonText="Create New Trait"
        />
    );
}
