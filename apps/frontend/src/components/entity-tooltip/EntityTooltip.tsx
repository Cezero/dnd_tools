import React from 'react';

import { ItemTooltip } from './ItemTooltip';
import { MonsterTooltip } from './MonsterTooltip';
import { SpellTooltip } from './SpellTooltip';
import type { EntityTooltipProps } from './types';

export function EntityTooltip({ entityType, entityId, children, href }: EntityTooltipProps): React.JSX.Element {
    // Route to appropriate tooltip component based on entity type
    switch (entityType) {
        case 'spell':
            return <SpellTooltip spellId={entityId} href={href}>{children}</SpellTooltip>;
        case 'monster':
            return <MonsterTooltip monsterId={entityId} href={href}>{children}</MonsterTooltip>;
        case 'item':
            return <ItemTooltip itemId={entityId} href={href}>{children}</ItemTooltip>;
        default:
            // For unsupported entity types, just render the children without tooltip
            return <>{children}</>;
    }
}
