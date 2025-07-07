import type { BaseMap, CoreComponent, CoreComponentAbbreviation, SelectOption, IdToNameMap } from './types';

export const NameSelectOptionList = <C extends CoreComponent>(list: C[]): SelectOption[] => {
    return list.map(item => ({ value: item.id, label: item.name })) as SelectOption[];
};

export const AbbreviationSelectOptionList = <C extends CoreComponentAbbreviation>(list: C[]): SelectOption[] => {
    return list.map(item => ({ value: item.id, label: item.abbreviation })) as SelectOption[];
};

export const ObjectIdToNameMap = <C extends CoreComponent>(map: BaseMap<C>): IdToNameMap => {
    return Object.fromEntries(Object.entries(map).map(([_key, value]) => [(value as CoreComponent).id, (value as CoreComponent).name])) as IdToNameMap;
};
