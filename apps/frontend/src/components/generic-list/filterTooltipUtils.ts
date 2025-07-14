import { FilterType, GenericListColumnMeta } from './types';

interface FilterValue {
    id: string;
    value: any;
}

export const formatFilterTooltip = (
    filter: FilterValue,
    columnMeta: GenericListColumnMeta
): string => {
    if (!filter || !filter.value) {
        return '';
    }

    switch (columnMeta.filterType) {
        case FilterType.TEXT_INPUT:
            // For text input, just show the string value
            return String(filter.value);

        case FilterType.SINGLE_SELECT:
            // For single select, find the label for the selected value
            if (columnMeta.options) {
                const option = columnMeta.options.find(opt => opt.value === filter.value);
                return option ? option.label : String(filter.value);
            }
            return String(filter.value);

        case FilterType.MULTI_SELECT:
            // For multi select, show values with appropriate delimiter
            if (filter.value.values && Array.isArray(filter.value.values)) {
                const logicType = filter.value.logicType || 'or';
                const delimiter = logicType === 'and' ? ' & ' : ' | ';

                if (columnMeta.options) {
                    // Map values to labels
                    const labels = filter.value.values.map((value: string | number) => {
                        const option = columnMeta.options!.find(opt => opt.value === value);
                        return option ? option.label : String(value);
                    });
                    return labels.join(delimiter);
                } else {
                    // Just use the raw values
                    return filter.value.values.map(String).join(delimiter);
                }
            }
            return '';

        default:
            return String(filter.value);
    }
}; 
