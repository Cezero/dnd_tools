import { PantheonMap } from "./types";
import { Setting } from "./CommonData";

export const Pantheon = {
    Greyhawk: 1,
    Faerunian: 2,
    Drow: 3,
    Mulhorandi: 4,
    Untheric: 5,
    SovereignHost: 6,
    DarkSix: 7,
    SilverFlame: 8,
    BloodofVol: 9,
    Greek: 10,
    Norse: 11,
    Egyption: 12,
    Dwarven: 13,
    Elven: 14,
    Gnome: 15,
    Halfling: 16,
    Orc: 17,
    Dragon: 18,
    Maztican: 19,
} as const;

export type Pantheon = typeof Pantheon[keyof typeof Pantheon];

export const PANTHEON_MAP: PantheonMap = {
    [Pantheon.Greyhawk]: { id: Pantheon.Greyhawk, name: 'Greyhawk' },
    [Pantheon.Faerunian]: { id: Pantheon.Faerunian, name: 'Faerûnian' },
    [Pantheon.Drow]: { id: Pantheon.Drow, name: 'Drow' },
    [Pantheon.Mulhorandi]: { id: Pantheon.Mulhorandi, name: 'Mulhorandi' },
    [Pantheon.Untheric]: { id: Pantheon.Untheric, name: 'Untheric' },
    [Pantheon.SovereignHost]: { id: Pantheon.SovereignHost, name: 'Sovereign Host' },
    [Pantheon.DarkSix]: { id: Pantheon.DarkSix, name: 'Dark Six' },
    [Pantheon.SilverFlame]: { id: Pantheon.SilverFlame, name: 'Silver Flame' },
    [Pantheon.BloodofVol]: { id: Pantheon.BloodofVol, name: 'Blood of Vol' },
    [Pantheon.Greek]: { id: Pantheon.Greek, name: 'Greek' },
    [Pantheon.Norse]: { id: Pantheon.Norse, name: 'Norse' },
    [Pantheon.Egyption]: { id: Pantheon.Egyption, name: 'Egyption' },
    [Pantheon.Dwarven]: { id: Pantheon.Dwarven, name: 'Dwarven' },
    [Pantheon.Elven]: { id: Pantheon.Elven, name: 'Elven' },
    [Pantheon.Gnome]: { id: Pantheon.Gnome, name: 'Gnome' },
    [Pantheon.Halfling]: { id: Pantheon.Halfling, name: 'Halfling' },
    [Pantheon.Orc]: { id: Pantheon.Orc, name: 'Orc' },
    [Pantheon.Dragon]: { id: Pantheon.Dragon, name: 'Dragon' },
    [Pantheon.Maztican]: { id: Pantheon.Maztican, name: 'Maztican' },
}

export const PANTHEON_LIST = Object.values(PANTHEON_MAP);

export const SettingPantheons = {
    [Setting.Greyhawk]: [
        Pantheon.Greyhawk,
        Pantheon.Drow,
        Pantheon.Dwarven,
        Pantheon.Elven,
        Pantheon.Gnome,
        Pantheon.Halfling,
        Pantheon.Orc,
        Pantheon.Dragon,
    ],
    [Setting.ForgottenRealms]: [
        Pantheon.Faerunian,
        Pantheon.Drow,
        Pantheon.Mulhorandi,
        Pantheon.Untheric,
        Pantheon.Drow,
        Pantheon.Dwarven,
        Pantheon.Elven,
        Pantheon.Gnome,
        Pantheon.Halfling,
        Pantheon.Orc,
        Pantheon.Dragon,
    ],
    [Setting.Eberron]: [
        Pantheon.SovereignHost,
        Pantheon.DarkSix,
        Pantheon.SilverFlame,
        Pantheon.BloodofVol
    ],
} as const;
