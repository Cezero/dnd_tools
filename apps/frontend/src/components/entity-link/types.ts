import type React from 'react';

import type { EntityType } from '@/components/entity-tooltip/types';

export interface EntityLinkProps {
    entityType: EntityType;
    entityId: number;
    href: string;
    children: React.ReactNode;
    className?: string;
}
