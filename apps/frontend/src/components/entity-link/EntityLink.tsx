import React from 'react';

import { EntityTooltip } from '@/components/entity-tooltip';

import type { EntityLinkProps } from './types';

export function EntityLink({ entityType, entityId, href, children, className = 'entity-link' }: EntityLinkProps): React.JSX.Element {
    return (
        <EntityTooltip entityType={entityType} entityId={entityId} href={href}>
            <a href={href} className={className}>
                {children}
            </a>
        </EntityTooltip>
    );
}
