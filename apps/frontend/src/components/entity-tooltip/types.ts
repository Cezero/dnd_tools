export type EntityType = 'spell' | 'monster' | 'item' | 'feat' | 'class' | 'race' | 'domain';

export interface EntityTooltipProps {
    entityType: EntityType;
    entityId: number;
    children: React.ReactNode;
    href?: string;
}

export interface SpellTooltipProps {
    spellId: number;
    children: React.ReactNode;
    href?: string;
}
