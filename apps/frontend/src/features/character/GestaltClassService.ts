import type { DnDClass, CharacterAdvancementWithDetailsResponse, FeatureProgression, SpellcastingProgressionWithSlots } from '@shared/schema';
import { EntityAppliesToType } from '@shared/static-data';

/**
 * Service for handling gestalt character class merging according to D&D 3.5 gestalt rules
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
     * Check if an advancement represents a gestalt character
     */
    static isGestalt(advancement: CharacterAdvancementWithDetailsResponse): boolean {
        return advancement.secondaryClassId !== null && advancement.secondaryClassId !== 0;
    }

    /**
     * Get class skill sources for UI display
     */
    static getClassSkillSources(classSkills: FeatureProgression[]): Map<number, string[]> {
        const skillSources = new Map<number, string[]>();

        classSkills.forEach(progression => {
            const className = (progression as FeatureProgression & { sourceClassName?: string }).sourceClassName;
            progression.entities?.forEach(entity => {
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
        progressions: SpellcastingProgressionWithSlots[];
    }> {
        const displays: Array<{
            classId: number;
            className: string;
            progressions: SpellcastingProgressionWithSlots[];
        }> = [];

        if (!gestaltClass.spellcastingProgression) {
            return displays;
        }

        // Get unique class IDs from the merged spellcasting progressions
        const classIds = new Set(gestaltClass.spellcastingProgression.map(prog => prog.classId));

        classIds.forEach(classId => {
            // Filter progressions for this class
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
                progressions: classProgressions
            });
        });

        return displays;
    }

    /**
     * Get spellcasting progressions for a specific class from the merged gestalt class
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
     * Get spells known progressions for a specific class from the merged gestalt class
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
        primaryFeatures: FeatureProgression[],
        secondaryFeatures: FeatureProgression[],
        primaryClassName: string,
        secondaryClassName: string
    ): (FeatureProgression & { sourceClassName: string })[] {
        return [
            ...primaryFeatures.map(f => ({ ...f, sourceClassName: primaryClassName })),
            ...secondaryFeatures.map(f => ({ ...f, sourceClassName: secondaryClassName }))
        ];
    }

}
