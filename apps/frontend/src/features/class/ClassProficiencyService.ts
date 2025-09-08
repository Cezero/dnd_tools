import { FeatApi } from '@/features/feat/FeatApi';
import { FeatureProgression, FeatureEntity } from '@shared/schema';
import { FeatBenefitType, EntityAppliesToType, SpecialFeatureId } from '@shared/static-data';

export const ClassProficiencyService = {
    /**
     * Fetch all feats that provide weapon or armor proficiencies
     */
    async getProficiencyFeats(): Promise<Array<{ id: number; name: string; proficiencyTypeId: number }>> {
        try {
            // Use the new proficiency query endpoint
            const response = await FeatApi.featQuery({ queryType: 'proficiency' });

            // Extract proficiency type from benefits
            const proficiencyFeats: Array<{ id: number; name: string; proficiencyTypeId: number }> = [];

            for (const feat of response.results) {
                if (feat.benefits && feat.benefits.length > 0) {
                    const proficiencyBenefit = feat.benefits.find(benefit =>
                        benefit.typeId === FeatBenefitType.PROFICIENCY
                    );

                    if (proficiencyBenefit && proficiencyBenefit.referenceId) {
                        proficiencyFeats.push({
                            id: feat.id,
                            name: feat.name,
                            proficiencyTypeId: proficiencyBenefit.referenceId
                        });
                    }
                }
            }

            return proficiencyFeats;
        } catch (error) {
            console.error('Failed to fetch proficiency feats:', error);
            return [];
        }
    },

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
                        entity.appliesTo === EntityAppliesToType.Feat &&
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
                    !(entity.appliesTo === EntityAppliesToType.Feat &&
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
