import { FeatureWithRelations, FeatureEntity } from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType } from '@shared/static-data';

export const ClassProficiencyService = {

    /**
     * Extract proficiencies from feature features
     */
    getClassProficiencies(
        features: FeatureWithRelations[]
    ): FeatureEntity[] {
        return features
            .filter(prog =>
                prog.sourceType === FeatureSourceType.Class &&
                prog.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Proficiency)
            )
            .flatMap(prog =>
                prog.entities
                    ?.filter((entity) =>
                        entity.type === EntityType.Base &&
                        entity.appliesTo === EntityAppliesToType.Proficiency &&
                        entity.appliesToId !== null
                    ) || []
            );
    },

    /**
     * Remove a proficiency from class proficiencies feature
     */
    removeProficiency(
        features: FeatureWithRelations[],
        setFeatures: (features: FeatureWithRelations[]) => void,
        featId: number,
        itemId: number
    ) {
        const updatedProgressions = features.map(prog => {
            // Find class proficiency features (class source with Base proficiency entities)
            if (prog.sourceType === FeatureSourceType.Class &&
                prog.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Proficiency)) {
                // Remove the specific proficiency entity
                const updatedEntities = prog.entities?.filter(entity =>
                    !(entity.type === EntityType.Base &&
                        entity.appliesTo === EntityAppliesToType.Proficiency &&
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

        // Remove the feature entirely if it has no entities left
        const finalProgressions = updatedProgressions.filter(prog =>
            !(prog.sourceType === FeatureSourceType.Class &&
                prog.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Proficiency)) ||
            (prog.entities && prog.entities.length > 0)
        );

        setFeatures(finalProgressions);
    }
}; 
