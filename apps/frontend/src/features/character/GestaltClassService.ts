import type { DnDClass, CharacterAdvancementWithDetailsResponse, FeatureWithRelations, SpellcastingProgressionWithSlots } from '@shared/schema';
import { EntityAppliesToType } from '@shared/static-data';

/** Class with optional features resolved from featureIds (callers must populate for mergeClasses) */
export type DnDClassWithFeatures = DnDClass & { features?: FeatureWithRelations[] };

/**
 * Service for handling gestalt character class merging according to D&D 3.5 gestalt rules
 */
export class GestaltClassService {
    /**
     * Merge two classes according to gestalt rules.
     * Callers must pass classes with features populated from featureIds (e.g. via ClassApi.getClassFeatures).
     */
    static mergeClasses(primaryClass: DnDClassWithFeatures, secondaryClass: DnDClassWithFeatures): DnDClass & { features: (FeatureWithRelations & { sourceClassName?: string })[] } {
        const merged = this.mergeFeatures(primaryClass.features ?? [], secondaryClass.features ?? [], primaryClass.name, secondaryClass.name);
        const featureIds = merged.map(f => f.id).filter((id): id is number => typeof id === 'number' && id > 0);

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
            featureIds,

            // Merged features with source tracking (for callers that need the full feature list)
            features: merged,

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
     * Check if an advancement represents a gestalt character
     */
    static isGestalt(advancement: CharacterAdvancementWithDetailsResponse): boolean {
        return advancement.secondaryClassId !== null && advancement.secondaryClassId !== 0;
    }

    /**
     * Get class skill sources for UI display
     */
    static getClassSkillSources(classSkills: FeatureWithRelations[]): Map<number, string[]> {
        const skillSources = new Map<number, string[]>();

        classSkills.forEach(feature => {
            const className = (feature as FeatureWithRelations & { sourceClassName?: string }).sourceClassName;
            feature.entities?.forEach(entity => {
                if (entity.appliesTo === EntityAppliesToType.Skill) {
                    const skillId = entity.appliesToId;

                    if (!skillSources.has(skillId)) {
                        skillSources.set(skillId, []);
                    }
                    if (className) {
                        skillSources.get(skillId)!.push(className);
                    }
                }
            });
        });

        return skillSources;
    }

    /**
     * Get spellcasting displays for UI
     */
    static getSpellcastingDisplays(
        gestaltClass: DnDClass,
        primaryClass: DnDClass,
        secondaryClass: DnDClass,
        primaryClassId?: number,
        secondaryClassId?: number
    ): Array<{
        classId: number;
        className: string;
        features: SpellcastingProgressionWithSlots[];
    }> {
        const displays: Array<{
            classId: number;
            className: string;
            features: SpellcastingProgressionWithSlots[];
        }> = [];

        if (!gestaltClass.spellcastingProgression) {
            return displays;
        }

        // Get unique class IDs from the merged spellcasting features
        const classIds = new Set(gestaltClass.spellcastingProgression.map(prog => prog.classId));

        classIds.forEach(classId => {
            // Filter features for this class
            const classProgressions = gestaltClass.spellcastingProgression!.filter(prog => prog.classId === classId);

            // Determine class name based on class ID
            let className = 'Unknown Class';
            if (primaryClassId && classId === primaryClassId) {
                className = primaryClass.name;
            } else if (secondaryClassId && classId === secondaryClassId) {
                className = secondaryClass.name;
            }

            displays.push({
                classId,
                className,
                features: classProgressions
            });
        });

        return displays;
    }

    /**
     * Get spellcasting features for a specific class from the merged gestalt class
     */
    static getSpellcastingProgressionsForClass(
        gestaltClass: DnDClass,
        classId: number
    ): SpellcastingProgressionWithSlots[] {
        if (!gestaltClass.spellcastingProgression) {
            return [];
        }

        return gestaltClass.spellcastingProgression.filter(prog => prog.classId === classId);
    }

    /**
     * Get spells known features for a specific class from the merged gestalt class
     */
    static getSpellsKnownProgressionsForClass(
        gestaltClass: DnDClass,
        classId: number
    ): SpellcastingProgressionWithSlots[] {
        if (!gestaltClass.spellsKnownProgression) {
            return [];
        }

        return gestaltClass.spellsKnownProgression.filter(prog => prog.classId === classId);
    }

    /**
     * Merge features from both classes with source tracking
     */
    private static mergeFeatures(
        primaryFeatures: FeatureWithRelations[],
        secondaryFeatures: FeatureWithRelations[],
        primaryClassName: string,
        secondaryClassName: string
    ): (FeatureWithRelations & { sourceClassName: string })[] {
        return [
            ...primaryFeatures.map(f => ({ ...f, sourceClassName: primaryClassName })),
            ...secondaryFeatures.map(f => ({ ...f, sourceClassName: secondaryClassName }))
        ];
    }

}
