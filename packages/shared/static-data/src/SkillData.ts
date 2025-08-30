import type { SkillMap } from './types';
import { NameSelectOptionList } from './Util';

export const SKILL_MAP: SkillMap = {
    1: { id: 1, name: 'Appraise', abilityId: 4, trainedOnly: false, isAnalog: false },
    2: { id: 2, name: 'Balance', abilityId: 2, trainedOnly: false, isAnalog: false },
    3: { id: 3, name: 'Bluff', abilityId: 6, trainedOnly: false, isAnalog: false },
    4: { id: 4, name: 'Climb', abilityId: 1, trainedOnly: false, isAnalog: false },
    5: { id: 5, name: 'Concentration', abilityId: 3, trainedOnly: false, isAnalog: false },
    6: { id: 6, name: 'Craft', abilityId: 4, trainedOnly: false, isAnalog: false },
    7: { id: 7, name: 'Decipher Script', abilityId: 4, trainedOnly: true, isAnalog: false },
    8: { id: 8, name: 'Diplomacy', abilityId: 6, trainedOnly: false, isAnalog: false },
    9: { id: 9, name: 'Disable Device', abilityId: 4, trainedOnly: true, isAnalog: false },
    10: { id: 10, name: 'Disguise', abilityId: 6, trainedOnly: false, isAnalog: false },
    11: { id: 11, name: 'Escape Artist', abilityId: 2, trainedOnly: false, isAnalog: false },
    12: { id: 12, name: 'Forgery', abilityId: 4, trainedOnly: false, isAnalog: false },
    13: { id: 13, name: 'Gather Information', abilityId: 6, trainedOnly: false, isAnalog: false },
    14: { id: 14, name: 'Handle Animal', abilityId: 6, trainedOnly: true, isAnalog: false },
    15: { id: 15, name: 'Heal', abilityId: 5, trainedOnly: false, isAnalog: false },
    16: { id: 16, name: 'Hide', abilityId: 2, trainedOnly: false, isAnalog: false },
    17: { id: 17, name: 'Intimidate', abilityId: 6, trainedOnly: false, isAnalog: false },
    18: { id: 18, name: 'Jump', abilityId: 1, trainedOnly: false, isAnalog: false },
    19: { id: 19, name: 'Knowledge (arcana)', abilityId: 4, trainedOnly: true, isAnalog: false },
    20: { id: 20, name: 'Knowledge (architecture and engineering)', abilityId: 4, trainedOnly: true, isAnalog: false },
    21: { id: 21, name: 'Knowledge (dungeoneering)', abilityId: 4, trainedOnly: true, isAnalog: false },
    22: { id: 22, name: 'Knowledge (geography)', abilityId: 4, trainedOnly: true, isAnalog: false },
    23: { id: 23, name: 'Knowledge (history)', abilityId: 4, trainedOnly: true, isAnalog: false },
    24: { id: 24, name: 'Knowledge (local)', abilityId: 4, trainedOnly: true, isAnalog: false },
    25: { id: 25, name: 'Knowledge (nature)', abilityId: 4, trainedOnly: true, isAnalog: false },
    26: { id: 26, name: 'Knowledge (nobility and royalty)', abilityId: 4, trainedOnly: true, isAnalog: false },
    27: { id: 27, name: 'Knowledge (religion)', abilityId: 4, trainedOnly: true, isAnalog: false },
    28: { id: 28, name: 'Knowledge (the planes)', abilityId: 4, trainedOnly: true, isAnalog: false },
    29: { id: 29, name: 'Listen', abilityId: 5, trainedOnly: false, isAnalog: false },
    30: { id: 30, name: 'Move Silently', abilityId: 2, trainedOnly: false, isAnalog: false },
    31: { id: 31, name: 'Open Lock', abilityId: 2, trainedOnly: true, isAnalog: false },
    32: { id: 32, name: 'Perform', abilityId: 6, trainedOnly: false, isAnalog: false },
    33: { id: 33, name: 'Profession', abilityId: 5, trainedOnly: true, isAnalog: false },
    34: { id: 34, name: 'Ride', abilityId: 2, trainedOnly: false, isAnalog: false },
    35: { id: 35, name: 'Search', abilityId: 4, trainedOnly: false, isAnalog: false },
    36: { id: 36, name: 'Sense Motive', abilityId: 5, trainedOnly: false, isAnalog: false },
    37: { id: 37, name: 'Sleight of Hand', abilityId: 2, trainedOnly: true, isAnalog: false },
    38: { id: 38, name: 'Speak Language', abilityId: 0, trainedOnly: true, isAnalog: false },
    39: { id: 39, name: 'Spellcraft', abilityId: 4, trainedOnly: true, isAnalog: false },
    40: { id: 40, name: 'Spot', abilityId: 5, trainedOnly: false, isAnalog: false },
    41: { id: 41, name: 'Survival', abilityId: 5, trainedOnly: false, isAnalog: false },
    42: { id: 42, name: 'Swim', abilityId: 1, trainedOnly: false, isAnalog: false },
    43: { id: 43, name: 'Tumble', abilityId: 2, trainedOnly: true, isAnalog: false },
    44: { id: 44, name: 'Use Magic Device', abilityId: 6, trainedOnly: true, isAnalog: false },
    45: { id: 45, name: 'Use Rope', abilityId: 2, trainedOnly: false, isAnalog: false },
    48: { id: 48, name: 'Wild Empathy', abilityId: 6, trainedOnly: true, isAnalog: true },
    49: { id: 49, name: 'Bardic Knowledge', abilityId: 4, trainedOnly: true, isAnalog: true },
};

export const SKILL_LIST = Object.values(SKILL_MAP);
export const FULL_SKILL_SELECT_LIST = NameSelectOptionList(SKILL_LIST);
export const SKILL_SELECT_LIST = NameSelectOptionList(SKILL_LIST.filter(skill => !skill.isAnalog));

export const SKILL_RETRY_TYPE_MAP: Record<number, string> = {
    0: 'No',
    1: 'Yes',
    2: 'Special',
};
