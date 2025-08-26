import React from 'react';

import { ReactComponent as ArmorVest } from './armor-vest.svg';
import { ReactComponent as AxeSword } from './axe-sword.svg';
import { ReactComponent as D100Die } from './d100_die.svg';
import { ReactComponent as D10Die } from './d10_die.svg';
import { ReactComponent as D12Die } from './d12_die.svg';
import { ReactComponent as D20Die } from './d20_die.svg';
import { ReactComponent as D4Die } from './d4_die.svg';
import { ReactComponent as D6Die } from './d6_die.svg';
import { ReactComponent as D8Die } from './d8_die.svg';

// Re-export all icons
export { AxeSword, ArmorVest, D4Die, D6Die, D8Die, D10Die, D12Die, D20Die, D100Die };

// Type for all icon components
export type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

// Icon mapping object for easy lookup
export const icons = {
    // Weapon/Armor icons
    axeSword: AxeSword,
    armorVest: ArmorVest,

    // Dice icons
    d4: D4Die,
    d6: D6Die,
    d8: D8Die,
    d10: D10Die,
    d12: D12Die,
    d20: D20Die,
    d100: D100Die
} as const;

// Type for icon names
export type IconName = keyof typeof icons;

// Dice type definitions
export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100'; 
