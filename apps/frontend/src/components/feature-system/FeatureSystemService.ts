import type { ProficiencyItem } from '@/components/feature-system';
import { ItemApi } from '@/features/item/ItemApi';
import { PROFICIENCY_TYPES } from '@shared/static-data';

export const FeatureSystemService = {
    async getItemsByProficiencyType(proficiencyTypeId: number): Promise<ProficiencyItem[]> {
        try {
            // Get proficiency info from the enhanced PROFICIENCY_TYPES
            const proficiencyInfo = PROFICIENCY_TYPES[proficiencyTypeId];
            if (!proficiencyInfo) {
                console.error('Unknown proficiency type:', proficiencyTypeId);
                return [];
            }

            // Use the new item query endpoint with the mapped values
            const response = await ItemApi.itemQuery({
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
}
