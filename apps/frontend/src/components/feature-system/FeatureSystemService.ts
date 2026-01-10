import { ItemQueryHooks } from '@/services/query/ItemQueryHooks';
import { PROFICIENCY_TYPES } from '@shared/static-data';

export const FeatureSystemService = {
    // Imperative version for use in React components
    async getItemsByProficiencyType(proficiencyTypeId: number) {
        const proficiencyInfo = PROFICIENCY_TYPES[proficiencyTypeId];

        if (!proficiencyInfo) {
            return {
                results: [],
                total: 0
            };
        }

        try {
            const queryResult = await ItemQueryHooks.itemQuery({
                queryType: 'byCategory',
                typeId: proficiencyInfo.itemTypeId.toString(),
                category: proficiencyInfo.category.toString()
            });

            // Apply filtering logic
            const filteredItems = queryResult.results?.filter(item => {
                // For tower shield proficiency, filter to only tower shields
                if (proficiencyTypeId === 8) { // Tower Shield
                    return item.name.toLowerCase().includes('tower');
                }
                return true;
            }) || [];

            return {
                results: filteredItems,
                total: filteredItems.length
            };
        } catch (error) {
            console.error('Failed to fetch items by proficiency type:', error);
            return {
                results: [],
                total: 0
            };
        }
    },
}
