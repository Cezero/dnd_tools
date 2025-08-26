import { FilterType } from '@shared/static-data';
import { FilterConfig, FilterValue } from './types';

export const formatFilterTooltip = (
    filter: FilterValue | undefined,
    columnMeta: FilterConfig,
    columnFilters?: FilterValue[]
): string => {
    if (!filter || !filter.value) {
        return '';
    }

    // Helper function to get options (handle both static arrays and dynamic functions)
    const getOptions = () => {
        if (!columnMeta.options) return null;
        if (typeof columnMeta.options === 'function') {
            return columnMeta.options(columnFilters || []);
        }
        return columnMeta.options;
    };

    switch (columnMeta.filterType) {
        case FilterType.TEXT_INPUT:
            // For text input, just show the string value
            return String(filter.value);

        case FilterType.SINGLE_SELECT: {
            // For single select, find the label for the selected value
            const singleSelectOptions = getOptions();
            if (singleSelectOptions) {
                const option = singleSelectOptions.find(opt => opt.value === filter.value);
                return option ? option.label : String(filter.value);
            }
            return String(filter.value);
        }

        case FilterType.MULTI_SELECT: {
            // For multi select, show values with appropriate delimiter
            if (typeof filter.value === 'object' && filter.value && 'values' in filter.value && Array.isArray(filter.value.values)) {
                const logicType = filter.value.logicType || 'or';
                const delimiter = logicType === 'and' ? ' & ' : ' | ';

                const multiSelectOptions = getOptions();
                if (multiSelectOptions) {
                    // Map values to labels
                    const labels = filter.value.values.map((value: string | number) => {
                        const option = multiSelectOptions.find(opt => opt.value === value);
                        return option ? option.label : String(value);
                    });
                    return labels.join(delimiter);
                } else {
                    // Just use the raw values
                    return filter.value.values.map(String).join(delimiter);
                }
            }
            return '';
        }

        default:
            return String(filter.value);
    }
}; 
