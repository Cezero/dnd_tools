import type { CraftSkillMap, KnowledgeSkillMap, SkillMap } from './types';

export const Skill = {
    Appraise: 1,
    Balance: 2,
    Bluff: 3,
    Climb: 4,
    Concentration: 5,
    Craft: 6,
    DecipherScript: 7,
    Diplomacy: 8,
    DisableDevice: 9,
    Disguise: 10,
    EscapeArtist: 11,
    Forgery: 12,
    GatherInformation: 13,
    HandleAnimal: 14,
    Heal: 15,
    Hide: 16,
    Intimidate: 17,
    Jump: 18,
    Knowledge: 19,
    Listen: 29,
    MoveSilently: 30,
    OpenLock: 31,
    Perform: 32,
    Profession: 33,
    Ride: 34,
    Search: 35,
    SenseMotive: 36,
    SleightOfHand: 37,
    SpeakLanguage: 38,
    Spellcraft: 39,
    Spot: 40,
    Survival: 41,
    Swim: 42,
    Tumble: 43,
    UseMagicDevice: 44,
    UseRope: 45,
    WildEmpathy: 48,
    BardicKnowledge: 49,
    Lore: 51,
} as const;

export type Skill = (typeof Skill)[keyof typeof Skill];

export const SKILL_MAP: SkillMap = {
    [Skill.Appraise]: { id: Skill.Appraise, name: 'Appraise', abilityId: 4, trainedOnly: false, isAnalog: false },
    [Skill.Balance]: { id: Skill.Balance, name: 'Balance', abilityId: 2, trainedOnly: false, isAnalog: false },
    [Skill.Bluff]: { id: Skill.Bluff, name: 'Bluff', abilityId: 6, trainedOnly: false, isAnalog: false },
    [Skill.Climb]: { id: Skill.Climb, name: 'Climb', abilityId: 1, trainedOnly: false, isAnalog: false },
    [Skill.Concentration]: { id: Skill.Concentration, name: 'Concentration', abilityId: 3, trainedOnly: false, isAnalog: false },
    [Skill.Craft]: { id: Skill.Craft, name: 'Craft', abilityId: 4, trainedOnly: false, isAnalog: false },
    [Skill.DecipherScript]: { id: Skill.DecipherScript, name: 'Decipher Script', abilityId: 4, trainedOnly: true, isAnalog: false },
    [Skill.Diplomacy]: { id: Skill.Diplomacy, name: 'Diplomacy', abilityId: 6, trainedOnly: false, isAnalog: false },
    [Skill.DisableDevice]: { id: Skill.DisableDevice, name: 'Disable Device', abilityId: 4, trainedOnly: true, isAnalog: false },
    [Skill.Disguise]: { id: Skill.Disguise, name: 'Disguise', abilityId: 6, trainedOnly: false, isAnalog: false },
    [Skill.EscapeArtist]: { id: Skill.EscapeArtist, name: 'Escape Artist', abilityId: 2, trainedOnly: false, isAnalog: false },
    [Skill.Forgery]: { id: Skill.Forgery, name: 'Forgery', abilityId: 4, trainedOnly: false, isAnalog: false },
    [Skill.GatherInformation]: { id: Skill.GatherInformation, name: 'Gather Information', abilityId: 6, trainedOnly: false, isAnalog: false },
    [Skill.HandleAnimal]: { id: Skill.HandleAnimal, name: 'Handle Animal', abilityId: 6, trainedOnly: true, isAnalog: false },
    [Skill.Heal]: { id: Skill.Heal, name: 'Heal', abilityId: 5, trainedOnly: false, isAnalog: false },
    [Skill.Hide]: { id: Skill.Hide, name: 'Hide', abilityId: 2, trainedOnly: false, isAnalog: false },
    [Skill.Intimidate]: { id: Skill.Intimidate, name: 'Intimidate', abilityId: 6, trainedOnly: false, isAnalog: false },
    [Skill.Jump]: { id: Skill.Jump, name: 'Jump', abilityId: 1, trainedOnly: false, isAnalog: false },
    [Skill.Knowledge]: { id: Skill.Knowledge, name: 'Knowledge', abilityId: 4, trainedOnly: true, isAnalog: false },
    [Skill.Listen]: { id: Skill.Listen, name: 'Listen', abilityId: 5, trainedOnly: false, isAnalog: false },
    [Skill.MoveSilently]: { id: Skill.MoveSilently, name: 'Move Silently', abilityId: 2, trainedOnly: false, isAnalog: false },
    [Skill.OpenLock]: { id: Skill.OpenLock, name: 'Open Lock', abilityId: 2, trainedOnly: true, isAnalog: false },
    [Skill.Perform]: { id: Skill.Perform, name: 'Perform', abilityId: 6, trainedOnly: false, isAnalog: false },
    [Skill.Profession]: { id: Skill.Profession, name: 'Profession', abilityId: 5, trainedOnly: true, isAnalog: false },
    [Skill.Ride]: { id: Skill.Ride, name: 'Ride', abilityId: 2, trainedOnly: false, isAnalog: false },
    [Skill.Search]: { id: Skill.Search, name: 'Search', abilityId: 4, trainedOnly: false, isAnalog: false },
    [Skill.SenseMotive]: { id: Skill.SenseMotive, name: 'Sense Motive', abilityId: 5, trainedOnly: false, isAnalog: false },
    [Skill.SleightOfHand]: { id: Skill.SleightOfHand, name: 'Sleight of Hand', abilityId: 2, trainedOnly: true, isAnalog: false },
    [Skill.SpeakLanguage]: { id: Skill.SpeakLanguage, name: 'Speak Language', abilityId: 0, trainedOnly: true, isAnalog: false },
    [Skill.Spellcraft]: { id: Skill.Spellcraft, name: 'Spellcraft', abilityId: 4, trainedOnly: true, isAnalog: false },
    [Skill.Spot]: { id: Skill.Spot, name: 'Spot', abilityId: 5, trainedOnly: false, isAnalog: false },
    [Skill.Survival]: { id: Skill.Survival, name: 'Survival', abilityId: 5, trainedOnly: false, isAnalog: false },
    [Skill.Swim]: { id: Skill.Swim, name: 'Swim', abilityId: 1, trainedOnly: false, isAnalog: false },
    [Skill.Tumble]: { id: Skill.Tumble, name: 'Tumble', abilityId: 2, trainedOnly: true, isAnalog: false },
    [Skill.UseMagicDevice]: { id: Skill.UseMagicDevice, name: 'Use Magic Device', abilityId: 6, trainedOnly: true, isAnalog: false },
    [Skill.UseRope]: { id: Skill.UseRope, name: 'Use Rope', abilityId: 2, trainedOnly: false, isAnalog: false },
    [Skill.WildEmpathy]: { id: Skill.WildEmpathy, name: 'Wild Empathy', abilityId: 6, trainedOnly: true, isAnalog: true },
    [Skill.BardicKnowledge]: { id: Skill.BardicKnowledge, name: 'Bardic Knowledge', abilityId: 4, trainedOnly: true, isAnalog: true },
    [Skill.Lore]: { id: Skill.Lore, name: 'Lore', abilityId: 4, trainedOnly: true, isAnalog: true },
};

export const SKILL_LIST = Object.values(SKILL_MAP);

export const SKILL_RETRY_TYPE_MAP: Record<number, string> = {
    0: 'No',
    1: 'Yes',
    2: 'Special',
};

export const SkillSubType = {
    skillSubId: 0,
    customSubtype: 1,
} as const;

export type SkillSubType = (typeof SkillSubType)[keyof typeof SkillSubType];

export const SKILL_SUB_TYPE_COMPATIBILITY = {
    [SkillSubType.skillSubId]: [
        Skill.Craft,
        Skill.Knowledge,
    ],
    [SkillSubType.customSubtype]: [
        Skill.Perform,
        Skill.Profession,
    ],
} as const;

export const CraftSkill = {
    Alchemy: 1,
    Armorsmithing: 2,
    Basketweaving: 3,
    Bookbinding: 4,
    Bowmaking: 5,
    Blacksmithing: 6,
    Calligraphy: 7,
    Carpentry: 8,
    Cobbling: 9,
    Gemcutting: 10,
    Glassblowing: 11,
    Leatherworking: 12,
    Locksmithing: 13,
    Painting: 14,
    Poisonmaking: 15,
    Pottery: 16,
    Sculpting: 17,
    Shipmaking: 18,
    SiegeEngines: 19,
    Stonemasonry: 20,
    Trapmaking: 21,
    Tattooing: 22,
    Weaponsmithing: 23,
    Weaving: 24,
} as const;

export type CraftSkill = (typeof CraftSkill)[keyof typeof CraftSkill];

export const CRAFT_SKILL_MAP: CraftSkillMap = {
    [CraftSkill.Alchemy]: { id: CraftSkill.Alchemy, name: 'alchemy' },
    [CraftSkill.Armorsmithing]: { id: CraftSkill.Armorsmithing, name: 'armorsmithing' },
    [CraftSkill.Basketweaving]: { id: CraftSkill.Basketweaving, name: 'basketweaving' },
    [CraftSkill.Bookbinding]: { id: CraftSkill.Bookbinding, name: 'bookbinding' },
    [CraftSkill.Bowmaking]: { id: CraftSkill.Bowmaking, name: 'bowmaking' },
    [CraftSkill.Blacksmithing]: { id: CraftSkill.Blacksmithing, name: 'blacksmithing' },
    [CraftSkill.Calligraphy]: { id: CraftSkill.Calligraphy, name: 'calligraphy' },
    [CraftSkill.Carpentry]: { id: CraftSkill.Carpentry, name: 'carpentry' },
    [CraftSkill.Cobbling]: { id: CraftSkill.Cobbling, name: 'cobbling' },
    [CraftSkill.Gemcutting]: { id: CraftSkill.Gemcutting, name: 'gemcutting' },
    [CraftSkill.Glassblowing]: { id: CraftSkill.Glassblowing, name: 'glassblowing' },
    [CraftSkill.Leatherworking]: { id: CraftSkill.Leatherworking, name: 'leatherworking' },
    [CraftSkill.Locksmithing]: { id: CraftSkill.Locksmithing, name: 'locksmithing' },
    [CraftSkill.Painting]: { id: CraftSkill.Painting, name: 'painting' },
    [CraftSkill.Poisonmaking]: { id: CraftSkill.Poisonmaking, name: 'poisonmaking' },
    [CraftSkill.Pottery]: { id: CraftSkill.Pottery, name: 'pottery' },
    [CraftSkill.Sculpting]: { id: CraftSkill.Sculpting, name: 'sculpting' },
    [CraftSkill.Shipmaking]: { id: CraftSkill.Shipmaking, name: 'shipmaking' },
    [CraftSkill.SiegeEngines]: { id: CraftSkill.SiegeEngines, name: 'siege engines' },
    [CraftSkill.Stonemasonry]: { id: CraftSkill.Stonemasonry, name: 'stonemasonry' },
    [CraftSkill.Trapmaking]: { id: CraftSkill.Trapmaking, name: 'trapmaking' },
    [CraftSkill.Tattooing]: { id: CraftSkill.Tattooing, name: 'tattooing' },
    [CraftSkill.Weaponsmithing]: { id: CraftSkill.Weaponsmithing, name: 'weaponsmithing' },
    [CraftSkill.Weaving]: { id: CraftSkill.Weaving, name: 'weaving' },
};

export const CRAFT_SKILL_LIST = Object.values(CRAFT_SKILL_MAP);

export const KnowledgeSkill = {
    Arcana: 1,
    ArchitectureAndEngineering: 2,
    Dungeoneering: 3,
    Geography: 4,
    History: 5,
    Local: 6,
    Nature: 7,
    NobilityAndRoyalty: 8,
    Religion: 9,
    ThePlanes: 10,
} as const;

export type KnowledgeSkill = (typeof KnowledgeSkill)[keyof typeof KnowledgeSkill];

export const KNOWLEDGE_SKILL_MAP: KnowledgeSkillMap = {
    [KnowledgeSkill.Arcana]: { id: KnowledgeSkill.Arcana, name: 'arcana' },
    [KnowledgeSkill.ArchitectureAndEngineering]: { id: KnowledgeSkill.ArchitectureAndEngineering, name: 'architecture and engineering' },
    [KnowledgeSkill.Dungeoneering]: { id: KnowledgeSkill.Dungeoneering, name: 'dungeoneering' },
    [KnowledgeSkill.Geography]: { id: KnowledgeSkill.Geography, name: 'geography' },
    [KnowledgeSkill.History]: { id: KnowledgeSkill.History, name: 'history' },
    [KnowledgeSkill.Local]: { id: KnowledgeSkill.Local, name: 'local' },
    [KnowledgeSkill.Nature]: { id: KnowledgeSkill.Nature, name: 'nature' },
    [KnowledgeSkill.NobilityAndRoyalty]: { id: KnowledgeSkill.NobilityAndRoyalty, name: 'nobility and royalty' },
    [KnowledgeSkill.Religion]: { id: KnowledgeSkill.Religion, name: 'religion' },
    [KnowledgeSkill.ThePlanes]: { id: KnowledgeSkill.ThePlanes, name: 'the planes' },
} as const;

export const KNOWLEDGE_SKILL_LIST = Object.values(KNOWLEDGE_SKILL_MAP);
