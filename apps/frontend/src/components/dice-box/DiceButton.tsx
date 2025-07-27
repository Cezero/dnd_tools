import React from 'react';
import { icons, type DiceType } from '@/assets/icons';
import { useDiceBox } from './index';
import type { DiceColor } from './types';
import { generateDiceColorScheme } from '@/utils/color-scheme';
import './dice-icons.css';

// Cache for generated color schemes to avoid recalculation
const colorSchemeCache = new Map<string, ReturnType<typeof generateDiceColorScheme>>();

interface DiceButtonProps {
    diceType: DiceType;
    rollNotation?: string;
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
    colors?: DiceColor;
}

export function DiceButton({
    diceType,
    rollNotation,
    className = '',
    disabled = false,
    onClick,
    colors
}: DiceButtonProps): React.JSX.Element {
    const { rollDice, isReady, isRolling, getCurrentIconColor } = useDiceBox();
    const DiceIcon = icons[diceType];
    const [isHovered, setIsHovered] = React.useState(false);

    if (rollNotation === undefined) {
        rollNotation = `1${diceType}`;
    }

    const handleClick = () => {
        if (onClick) {
            onClick();
            return;
        }
        if (!isReady) { return; }
        if (isRolling) { return; }
        rollDice(rollNotation, 'dice-button');
    };

    const isDisabled = disabled || !isReady || isRolling;

    // Generate color scheme based on provided colors or current DiceBox color
    const colorScheme = React.useMemo(() => {
        const baseColor = colors?.main || getCurrentIconColor();

        // Check cache first
        let generatedScheme = colorSchemeCache.get(baseColor);
        if (!generatedScheme) {
            generatedScheme = generateDiceColorScheme(baseColor);
            colorSchemeCache.set(baseColor, generatedScheme);
        }

        return {
            default: colors || generatedScheme.default,
            hover: generatedScheme.hover,
            disabled: generatedScheme.disabled
        };
    }, [colors, getCurrentIconColor]);

    // Determine which color set to use based on state
    let activeColors: DiceColor;
    if (isDisabled) {
        activeColors = colorScheme.disabled;
    } else if (isHovered) {
        activeColors = colorScheme.hover;
    } else {
        activeColors = colorScheme.default;
    }

    // Apply colors directly to the SVG
    const iconStyle = {
        '--die-color-fill': activeColors.main,
        '--die-edges-stroke': activeColors.edges,
        '--die-edges-stroke-width': activeColors.edgesStrokeWidth + 'px',
        '--die-edges-stroke-color': activeColors.edgesStrokeColor,
        '--die-numbers-fill': activeColors.numbers,
        '--die-numbers-stroke': activeColors.numbersStrokeColor,
        '--die-numbers-stroke-width': activeColors.numbersStrokeWidth + 'px'
    } as React.CSSProperties;

    // Base button classes with disabled state
    const buttonClasses = [
        'transition-colors',
        'disabled:cursor-not-allowed',
        'disabled:opacity-50',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            onClick={handleClick}
            disabled={isDisabled}
            className={buttonClasses}
            aria-label={`Roll ${rollNotation}`}
            title={`Roll ${rollNotation}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <DiceIcon
                className="w-full h-full"
                style={iconStyle}
            />
        </button>
    );
} 
