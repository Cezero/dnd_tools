import { FeatService } from '@/features/feat/FeatService';
import { ItemService } from '@/features/item/ItemService';
import { FeatBenefitType, PROFICIENCY_TYPES } from '@shared/static-data';
import { ClassProficiencyInQueryResponse } from '@shared/schema';

export interface ProficiencyFeat {
    id: number;
    name: string;
    proficiencyTypeId: number;
}

export interface ProficiencyItem {
    id: number;
    name: string;
    typeId: number;
    weapon?: {
        category: number;
        type: number;
    };
    armor?: {
        category: number;
    };
}

export const ClassProficiencyService = {
    /**
     * Fetch all feats that provide weapon or armor proficiencies
     */
    async getProficiencyFeats(): Promise<ProficiencyFeat[]> {
        try {
            // Use the new proficiency query endpoint
            const response = await FeatService.featQuery({ queryType: 'proficiency' });

            // Extract proficiency type from benefits
            const proficiencyFeats: ProficiencyFeat[] = [];

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
     * Fetch items that match a specific proficiency type
     */
    async getItemsByProficiencyType(proficiencyTypeId: number): Promise<ProficiencyItem[]> {
        try {
            // Get proficiency info from the enhanced PROFICIENCY_TYPES
            const proficiencyInfo = PROFICIENCY_TYPES[proficiencyTypeId];
            if (!proficiencyInfo) {
                console.error('Unknown proficiency type:', proficiencyTypeId);
                return [];
            }

            // Use the new item query endpoint with the mapped values
            const response = await ItemService.itemQuery({
                queryType: 'byCategory',
                typeId: proficiencyInfo.itemTypeId,
                category: proficiencyInfo.category
            });

            // For tower shield proficiency, filter to only tower shields
            let filteredItems = response.results;
            if (proficiencyTypeId === 8) { // Tower Shield
                filteredItems = response.results.filter(item =>
                    item.name.toLowerCase().includes('tower')
                );
            }

            return filteredItems.map(item => ({
                id: item.id,
                name: item.name,
                typeId: item.typeId,
                weapon: item.weapon,
                armor: item.armor
            }));
        } catch (error) {
            console.error('Failed to fetch items by proficiency type:', error);
            return [];
        }
    },



    /**
     * Get display information for proficiencies
     */
    async getProficiencyDisplay(proficiencies: Array<{ featId: number; itemId: number }>): Promise<ClassProficiencyInQueryResponse[]> {
        try {
            const allFeats = await FeatService.getFeats({});
            const allItems = await ItemService.getItems({});

            return proficiencies.map(prof => {
                const feat = allFeats.results.find(f => f.id === prof.featId);
                const item = prof.itemId === -1 ? null : allItems.results.find(i => i.id === prof.itemId);

                return {
                    featId: prof.featId,
                    featName: feat?.name || `Feat ${prof.featId}`,
                    itemId: prof.itemId,
                    itemName: prof.itemId === -1 ? 'All Items' : (item?.name || `Item ${prof.itemId}`)
                };
            });
        } catch (error) {
            console.error('Failed to get proficiency display info:', error);
            return proficiencies.map(prof => ({
                featId: prof.featId,
                featName: `Feat ${prof.featId}`,
                itemId: prof.itemId,
                itemName: prof.itemId === -1 ? 'All Items' : `Item ${prof.itemId}`
            }));
        }
    }
}; 
