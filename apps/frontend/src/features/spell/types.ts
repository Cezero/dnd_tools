import type { GetSpellResponse, Spell } from '@shared/schema';

export interface SpellDisplayContentProps {
    spell: Spell | GetSpellResponse | null | undefined;
    showHeader?: boolean;
    classLevelDisplay?: string;
}
