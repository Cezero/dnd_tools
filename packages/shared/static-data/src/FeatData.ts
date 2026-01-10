import type { CoreComponent, BaseMap, IdToNameMap } from './types';
import { ObjectIdToNameMap } from './Util';

export const enum FeatType {
    GENERAL = 1,
    ITEM_CREATION = 2,
    METAMAGIC = 3,
}

export const FEAT_TYPES: BaseMap<CoreComponent> = {
    [FeatType.GENERAL]: { id: FeatType.GENERAL, name: 'General' },
    [FeatType.ITEM_CREATION]: { id: FeatType.ITEM_CREATION, name: 'Item Creation' },
    [FeatType.METAMAGIC]: { id: FeatType.METAMAGIC, name: 'Metamagic' },
}

export const FEAT_TYPE_BY_ID: IdToNameMap = ObjectIdToNameMap(FEAT_TYPES);
export const FEAT_TYPE_LIST = Object.values(FEAT_TYPES);
