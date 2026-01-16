import type { DnDClass, FeatureProgression } from '@shared/schema';

import { GestaltFeatureFilter } from './gestaltFeatureFilter';

/**
 * Service for handling gestalt character class merging according to D&D 3.5 gestalt rules
 * Ported from frontend GestaltClassService
 */
export class GestaltClassService {
    /**
     * Merge two classes according to gestalt rules
     */
    static mergeClasses(primaryClass: DnDClass, secondaryClass: DnDClass): DnDClass {
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

            // Note: All mechanics (hitDie, skillPoints, BAB, saving throws, casting ability/type)
            // are now stored in feature entities, not on the class model
            // They will be resolved from the merged features

            // Merged features with source tracking and filtering of overlapping mechanics
            features: this.mergeFeatures(primaryClass.features || [], secondaryClass.features || [], primaryClass.name, secondaryClass.name),

            // Merged spellcasting progressions
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
     * are filtered to keep only the best progression according to gestalt rules.
     */
    private static mergeFeatures(
        primaryFeatures: FeatureProgression[],
        secondaryFeatures: FeatureProgression[],
        primaryClassName: string,
        secondaryClassName: string
    ): (FeatureProgression & { sourceClassName?: string })[] {
        // Filter overlapping mechanics to keep only the best progression
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










