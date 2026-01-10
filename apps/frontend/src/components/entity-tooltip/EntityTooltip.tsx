import { PreviewCard } from '@base-ui-components/react/preview-card';
import React from 'react';

import type { EntityTooltipProps } from './types';
import { SpellTooltip } from './SpellTooltip';

export function EntityTooltip({ entityType, entityId, children, href }: EntityTooltipProps): React.JSX.Element {
    // Route to appropriate tooltip component based on entity type
    switch (entityType) {
        case 'spell':
            return <SpellTooltip spellId={entityId} href={href}>{children}</SpellTooltip>;
        // Future entity types can be added here:
        // case 'monster':
        //     return <MonsterTooltip monsterId={entityId} href={href}>{children}</MonsterTooltip>;
        // case 'item':
        //     return <ItemTooltip itemId={entityId} href={href}>{children}</ItemTooltip>;
        default:
            // For unsupported entity types, just render the children without tooltip
            return <>{children}</>;
    }
}
