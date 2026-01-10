import React from 'react';
import { Link } from 'react-router-dom';

import { EntityTooltip } from '@/components/entity-tooltip';

import type { EntityLinkProps } from './types';

export function EntityLink({ entityType, entityId, href, children, className = 'entity-link' }: EntityLinkProps): React.JSX.Element {
    return (
        <EntityTooltip entityType={entityType} entityId={entityId} href={href}>
            <Link to={href} className={className}>
                {children}
            </Link>
        </EntityTooltip>
    );
}
