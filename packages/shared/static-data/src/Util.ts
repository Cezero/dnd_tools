import type { BaseMap, CoreComponent, IdToNameMap } from './types';

export const ObjectIdToNameMap = <C extends CoreComponent>(map: BaseMap<C>): IdToNameMap => {
    return Object.fromEntries(Object.entries(map).map(([_key, value]) => [(value as CoreComponent).id, (value as CoreComponent).name])) as IdToNameMap;
};
