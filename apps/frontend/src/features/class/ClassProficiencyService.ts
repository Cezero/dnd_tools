import { FeatApi } from '@/features/feat/FeatApi';
import { FeatureProgression } from '@shared/schema';
import { FeatBenefitType, ModifierAppliesToType, ModifierType, SpecialFeatureId } from '@shared/static-data';

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
    ): Array<{ featId: number; itemId: number; featName: string; itemName?: string }> {
        return progressions
            .filter(prog => prog.featureId === SpecialFeatureId.ClassProficiency)
            .flatMap(prog =>
                prog.modifiers
                    ?.filter((mod) =>
                        mod.appliesTo === ModifierAppliesToType.Feat &&
                        mod.itemId !== null
                    )
                    .map((mod) => ({
                        featId: mod.appliesToId || 0,
                        itemId: mod.itemId || -1,
                        featName: `Feat ${mod.appliesToId}`, // Will need feat lookup
                        itemName: mod.itemId === -1 ? undefined : `Item ${mod.itemId}` // Will need item lookup
                    })) || []
            )
            .filter(prof => prof.featId > 0);
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
                // Remove the specific proficiency modifier
                const updatedModifiers = prog.modifiers?.filter(mod =>
                    !(mod.appliesTo === ModifierAppliesToType.Feat &&
                        mod.appliesToId === featId &&
                        mod.itemId === itemId)
                ) || [];

                return {
                    ...prog,
                    modifiers: updatedModifiers
                };
            }
            return prog;
        });

        // Remove the progression entirely if it has no modifiers left
        const finalProgressions = updatedProgressions.filter(prog =>
            !(prog.featureId === SpecialFeatureId.ClassProficiency) ||
            (prog.modifiers && prog.modifiers.length > 0)
        );

        setFeatureProgressions(finalProgressions);
    }
}; 
