
export type NameToIdMap = {
    [key: string]: number;
};

export type IdToNameMap = {
    [key: number]: string;
};

export type BaseMap<C extends CoreComponent> = {
    [key: number]: C;
};

export interface CoreComponent {
    id: number;
    name: string;
    abbreviation?: string;
}

export interface FilterableComponent extends CoreComponent {
    editionId: number;
    isVisible: boolean;
}

// Extended type for appliesTo types with optional display names
export interface AppliesToType extends CoreComponent {
    displayName?: string | null;
}

export interface RpgDie extends CoreComponent {
    sides: number;
}

export interface Currency extends CoreComponent {
    gpValue: number;
}

// FeatBenefitTypeInfo removed - feat benefits now use Feature system (EntityAppliesToType, EntityType)

export interface Formula extends CoreComponent {
    description: string;
    parameters: FormulaParameter[];
    calculate: (params: Record<string, any>) => number | null;
    getDisplayString: (params: Record<string, any>) => string;
    isCharacterDependent: boolean; // Does this formula require character context?
}

export interface FormulaParameter {
    name: string;
    description: string;
    required: boolean;
    defaultValue?: number;
}

export interface Size extends CoreComponent {
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
    allName: string;
}

export interface FeatBenefit {
    typeId: number;
    referenceId: number;
    amount?: number;
}

export interface Feat extends CoreComponent {
    type: string;
    description: string;
    prerequisites: string;
    benefit: string;
    special: string;
    sourceId: number;
    benefits?: FeatBenefit[];
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

export interface SkillDetail extends CoreComponent {
    abilityId: number;
    trainedOnly: boolean;
    isAnalog: boolean;
}

export interface SourceBookData extends CoreComponent {
    editionId: number;
    isVisible?: boolean;
}

export interface DiceTheme extends CoreComponent {
    systemName: string;
    description: string;
    ignoresThemeColor: boolean;
}

export type AbilityMap = BaseMap<CoreComponent>;
export type SavingThrowMap = BaseMap<CoreComponent>;
export type RpgDieMap = BaseMap<RpgDie>;
export type CurrencyMap = BaseMap<Currency>;
export type AlignmentMap = BaseMap<CoreComponent>;
export type SizeMap = BaseMap<Size>;
export type LanguageMap = BaseMap<Language>;
export type EditionMap = BaseMap<CoreComponent>;
export type ProficiencyMap = BaseMap<Proficiency>;
export type FeatMap = BaseMap<Feat>;
export type ItemMap = BaseMap<Item>;
export type SpellMap = BaseMap<Spell>;
export type SpellComponentMap = BaseMap<CoreComponent>;
export type SpellDescriptorMap = BaseMap<CoreComponent>;
export type SpellRangeMap = BaseMap<CoreComponent>;
export type SpellSchoolMap = BaseMap<CoreComponent>;
export type SpellSubschoolMap = BaseMap<CoreComponent>;
export type CraftSkillMap = BaseMap<CoreComponent>;
export type KnowledgeSkillMap = BaseMap<CoreComponent>;
export type SourceBookMap = BaseMap<SourceBookData>;
export type DiceThemeMap = { [key: string]: DiceTheme };
export type CastingTypeMap = BaseMap<CoreComponent>;
export type PantheonMap = BaseMap<CoreComponent>;
export type SettingMap = BaseMap<CoreComponent>;
export type AbilityGenerationMethodMap = BaseMap<CoreComponent>;
export type PointBuyOptionsMap = BaseMap<CoreComponent>;
export type BooleanFilterMap = BaseMap<CoreComponent>;
export type ClassTypeMap = BaseMap<CoreComponent>;
// FeatBenefitTypeMap removed - feat benefits now use Feature system (EntityAppliesToType, EntityType)
export type MonsterTypeMap = BaseMap<CoreComponent>;
export type MonsterSubtypeMap = BaseMap<CoreComponent>;
export type MonsterSpecialAbilityTypeMap = BaseMap<CoreComponent>;
export type MonsterArmorComponentTypeMap = BaseMap<CoreComponent>;
export type MonsterSpellTypeMap = BaseMap<CoreComponent>;
export type MonsterSpellUsesPerDayMap = BaseMap<CoreComponent>;
export type MovementTypeMap = BaseMap<CoreComponent>;
export type ManeuverabilityMap = BaseMap<CoreComponent>;
export type MonsterExtraDescriptionTypeMap = BaseMap<CoreComponent>;
