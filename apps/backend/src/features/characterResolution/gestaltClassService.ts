import type { DnDClass, FeatureProgression } from '@shared/schema';

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
            description: primaryClass.description,
            sourceBookInfo: primaryClass.sourceBookInfo,

            // Gestalt rules - choose the better aspects
            hitDie: Math.max(primaryClass.hitDie, secondaryClass.hitDie),
            skillPoints: Math.max(primaryClass.skillPoints, secondaryClass.skillPoints),
            babProgression: Math.min(primaryClass.babProgression, secondaryClass.babProgression) as 0 | 1 | 2,
            fortProgression: Math.min(primaryClass.fortProgression, secondaryClass.fortProgression) as 0 | 1 | 2,
            refProgression: Math.min(primaryClass.refProgression, secondaryClass.refProgression) as 0 | 1 | 2,
            willProgression: Math.min(primaryClass.willProgression, secondaryClass.willProgression) as 0 | 1 | 2,

            // Casting ability - use primary class, but could be enhanced for gestalt
            castingAbilityId: primaryClass.castingAbilityId,
            castingType: primaryClass.castingType,

            // Merged features with source tracking
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
     * Merge features from both classes with source tracking
     */
    private static mergeFeatures(
        primaryFeatures: FeatureProgression[],
        secondaryFeatures: FeatureProgression[],
        primaryClassName: string,
        secondaryClassName: string
    ): (FeatureProgression & { sourceClassName?: string })[] {
        return [
            ...primaryFeatures.map(f => ({ ...f, sourceClassName: primaryClassName })),
            ...secondaryFeatures.map(f => ({ ...f, sourceClassName: secondaryClassName }))
        ];
    }
}










