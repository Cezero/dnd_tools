export interface CharacterData {
    // Basic info
    name: string;
    level: number;
    experience: number;
    alignment: number | null; // Alignment ID

    // Abilities and Race
    race: number | null; // Race ID
    abilities: {
        [key: number]: number | undefined; // Ability ID -> Score (undefined for unassigned)
    };

    // Class
    class: number | null; // Class ID
    classFeatures: string[];
    hitPoints: number;
    armorClass: number;

    // Skills
    skills: Record<number, number>; // skillId -> ranks (for regular skills)
    skillSubtypes: Record<number, { ranks: number; subtype: string }[]>; // skillId -> array of subtypes with ranks
    skillPoints: number;

    // Feats
    feats: string[];
    bonusFeats: string[];

    // Description
    description: string;
    background: string;
    appearance: string;

    // Equipment
    equipment: string[];
    money: {
        [key: number]: number; // Currency ID -> Amount
    };

    // Languages (determined by race, class, and intelligence)
    languages: number[]; // Language IDs
    bonusLanguages: number[]; // Additional languages chosen by player
} 
