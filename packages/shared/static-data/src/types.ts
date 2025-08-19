export interface SelectOption {
    value: number;
    label: string;
}

export type NameToIdMap = {
    [key: string]: number;
};

export type IdToNameMap = {
    [key: number]: string;
};

export type BaseMap<C extends CoreComponent> = {
    [key: number]: C;
};

export type SelectOptionMap<C extends SelectOption> = {
    [key: number]: C;
};

export interface CoreComponent {
    id: number;
    name: string;
}

export interface CoreComponentAbbreviation extends CoreComponent {
    abbreviation: string;
}

export interface RpgDie extends CoreComponent {
    sides: number;
}

export interface Currency extends CoreComponentAbbreviation {
    gpValue: number;
}

export interface Formula extends CoreComponent {
    description: string;
    parameters: FormulaParameter[];
    calculate: (params: Record<string, number>) => number;
}

export interface FormulaParameter {
    name: string;
    description: string;
    required: boolean;
    defaultValue?: number;
}

export interface Size extends CoreComponentAbbreviation {
    sizeModifier: number;
    grappleModifier: number;
    hideModifier: number;
    heightOrLength: string;
    weight: string;
    space: string;
    naturalReachTall: number;
    naturalReachLong: number;
}

export interface Language extends CoreComponent {
    typicalSpeakers: string;
    alphabet: string;
}

export interface Proficiency extends CoreComponent {
    itemTypeId: number;
    category: number;
}

export interface Feat extends CoreComponent {
    type: string;
    description: string;
    prerequisites: string;
    benefit: string;
    special: string;
    sourceId: number;
}

export interface Item extends CoreComponent {
    type: string;
    cost: number;
    weight: number;
    description: string;
    sourceId: number;
}

export interface Spell extends CoreComponent {
    editionId: number;
}

export interface SpellSubschool extends CoreComponent {
    schoolId: number;
}

export interface ClassNameMap {
    [key: string]: string;
}

export interface Skill extends CoreComponent {
    abilityId: number;
    trainedOnly: boolean;
    isAnalog: boolean;
}

export interface SourceBook extends CoreComponentAbbreviation {
    editionId: number;
    hasSpells: boolean;
    hasClasses: boolean;
}

export interface Class extends CoreComponentAbbreviation {
    editionId: number;
    isPrestige: boolean;
    isVisible: boolean;
    canCastSpells: boolean;
}

export interface DiceTheme extends CoreComponent {
    systemName: string;
    description: string;
    ignoresThemeColor: boolean;
}

export type SpellTable = { [characterLevel: number]: { [spellLevel: number]: number } };


export type AbilityMap = BaseMap<CoreComponentAbbreviation>;
export type SavingThrowMap = BaseMap<CoreComponentAbbreviation>;
export type RpgDieMap = BaseMap<RpgDie>;
export type CurrencyMap = BaseMap<Currency>;
export type AlignmentMap = BaseMap<CoreComponentAbbreviation>;
export type SizeMap = BaseMap<Size>;
export type LanguageMap = BaseMap<Language>;
export type EditionMap = BaseMap<CoreComponentAbbreviation>;
export type ProficiencyMap = BaseMap<Proficiency>;
export type FeatMap = BaseMap<Feat>;
export type ItemMap = BaseMap<Item>;
export type SpellMap = BaseMap<Spell>;
export type SpellComponentMap = BaseMap<CoreComponentAbbreviation>;
export type SpellDescriptorMap = BaseMap<CoreComponent>;
export type SpellRangeMap = BaseMap<CoreComponentAbbreviation>;
export type SpellSchoolMap = BaseMap<CoreComponentAbbreviation>;
export type SpellSubschoolMap = BaseMap<SpellSubschool>;
export type SpellSubschoolSelectMap = SelectOptionMap<SelectOption>;
export type SkillMap = BaseMap<Skill>;
export type SourceBookMap = BaseMap<SourceBook>;
export type ClassMap = BaseMap<Class>;
export type DiceThemeMap = { [key: string]: DiceTheme };
