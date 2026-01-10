import { FeatureProgression, FeatureEntity } from '@shared/schema';
import { EntityAppliesToType, EntityType, SpecialFeatureId } from '@shared/static-data';

export const ClassProficiencyService = {

    /**
     * Extract proficiencies from feature progressions
     */
    getClassProficiencies(
        progressions: FeatureProgression[]
    ): FeatureEntity[] {
        return progressions
            .filter(prog => prog.featureId === SpecialFeatureId.ClassProficiency)
            .flatMap(prog =>
                prog.entities
                    ?.filter((entity) =>
                        entity.appliesTo === EntityAppliesToType.Proficiency &&
                        entity.appliesToId !== null
                    ) || []
            );
    },

    /**
     * Remove a proficiency from class proficiencies progression
     */
    removeProficiency(
        featureProgressions: FeatureProgression[],
        setFeatureProgressions: (progressions: FeatureProgression[]) => void,
        featId: number,
        itemId: number
    ) {
        const updatedProgressions = featureProgressions.map(prog => {
            if (prog.featureId === SpecialFeatureId.ClassProficiency) {
                // Remove the specific proficiency entity
                const updatedEntities = prog.entities?.filter(entity =>
                    !(entity.appliesTo === EntityAppliesToType.Proficiency &&
                        entity.appliesToId === featId &&
                        entity.appliesToSubId === itemId)
                ) || [];

                return {
                    ...prog,
                    entities: updatedEntities
                };
            }
            return prog;
        });

        // Remove the progression entirely if it has no entities left
        const finalProgressions = updatedProgressions.filter(prog =>
            !(prog.featureId === SpecialFeatureId.ClassProficiency) ||
            (prog.entities && prog.entities.length > 0)
        );

        setFeatureProgressions(finalProgressions);
    }
}; 
