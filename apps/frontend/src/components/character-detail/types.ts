import type React from 'react';

import type { CalculationBreakdown } from '@/lib/formatters/types';

/**
 * Props for ValueTooltip component
 */
export interface ValueTooltipProps {
    breakdown: CalculationBreakdown | null | undefined;
    children: React.ReactNode;
}

/**
 * Props for DiceLink component
 */
export interface DiceLinkProps {
    notation: string;
    label?: string;
    className?: string;
}
