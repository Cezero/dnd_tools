import type { DnDClass, FeatureWithRelations } from '@shared/schema';

import { GestaltFeatureFilter } from './gestaltFeatureFilter';

/**
 * Extended DnDClass type that includes features array (as returned by getClassById).
 * The runtime object includes features even though the DnDClass type doesn't.
 */
type DnDClassWithFeatures = DnDClass & {
    features?: FeatureWithRelations[];
};

/**
 * Service for handling gestalt character class merging according to D&D 3.5 gestalt rules
 * Ported from frontend GestaltClassService
 */
export class GestaltClassService {
    /**
     * Merge two classes according to gestalt rules
     */
    static mergeClasses(primaryClass: DnDClassWithFeatures, secondaryClass: DnDClassWithFeatures): DnDClassWithFeatures {
        return {
            // Basic class info from primary class
            name: `${primaryClass.name}/${secondaryClass.name}`,
            abbreviation: `${primaryClass.abbreviation}/${secondaryClass.abbreviation}`,
            editionId: primaryClass.editionId,
            isPrestige: primaryClass.isPrestige,
            isVisible: primaryClass.isVisible,
            canCastSpells: primaryClass.canCastSpells || secondaryClass.canCastSpells,
            spellsKnown: primaryClass.spellsKnown || secondaryClass.spellsKnown,
            isDivine: primaryClass.isDivine || secondaryClass.isDivine,
            description: primaryClass.description,
            sourceBookInfo: primaryClass.sourceBookInfo,
            featureIds: [
                ...(primaryClass.featureIds || []),
                ...(secondaryClass.featureIds || [])
            ],

            // Note: All mechanics (hitDie, skillPoints, BAB, saving throws, casting ability/type)
            // are now stored in feature entities, not on the class model
            // They will be resolved from the merged features

            // Merged features with source tracking and filtering of overlapping mechanics
            features: this.mergeFeatures(primaryClass.features || [], secondaryClass.features || [], primaryClass.name, secondaryClass.name),

            // Merged spellcasting features
            spellcastingProgression: [
                ...(primaryClass.spellcastingProgression || []),
                ...(secondaryClass.spellcastingProgression || [])
            ],
            spellsKnownProgression: [
                ...(primaryClass.spellsKnownProgression || []),
                ...(secondaryClass.spellsKnownProgression || [])
            ]
        };
    }

    /**
     * Merge features from both classes with source tracking and filtering of overlapping mechanics.
     * 
     * For gestalt characters, overlapping class-mechanics features (BAB, saves, hit die, skill points)
     * are filtered to keep only the best feature according to gestalt rules.
     */
    private static mergeFeatures(
        primaryFeatures: FeatureWithRelations[],
        secondaryFeatures: FeatureWithRelations[],
        primaryClassName: string,
        secondaryClassName: string
    ): (FeatureWithRelations & { sourceClassName?: string })[] {
        // Filter overlapping mechanics to keep only the best feature
        const filteredFeatures = GestaltFeatureFilter.filterOverlappingMechanics(
            primaryFeatures,
            secondaryFeatures
        );

        // Add source tracking to filtered features
        return filteredFeatures.map(f => {
            // Determine source class name based on which class the feature came from
            const isFromPrimary = primaryFeatures.some(pf => pf.id === f.id);
            const sourceClassName = isFromPrimary ? primaryClassName : secondaryClassName;
            return { ...f, sourceClassName };
        });
    }
}










