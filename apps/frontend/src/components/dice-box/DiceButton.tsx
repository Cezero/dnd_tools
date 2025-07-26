import React from 'react';
import { icons, type DiceType } from '@/assets/icons';
import { useDiceBox } from './DiceBoxProvider';
import { UseAuth } from '@/components/auth/AuthProvider';
import type { DiceColor } from './types';
import { DEFAULT_DICE_COLORS, HOVER_DICE_COLORS, DISABLED_DICE_COLORS } from './constants';
import { generateDiceColorScheme } from '@/utils/color-scheme';
import './dice-icons.css';

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
    const { rollDice, isReady, isRolling } = useDiceBox();
    const { userDiceConfig } = UseAuth();
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

    // Generate color scheme based on provided colors, user's iconColor, or defaults
    const colorScheme = React.useMemo(() => {
        if (colors) {
            // If custom colors provided, use them directly for default state
            // and generate hover/disabled states from the main color
            const generatedScheme = generateDiceColorScheme(colors.main);
            return {
                default: colors, // Use the provided custom colors
                hover: generatedScheme.hover,
                disabled: generatedScheme.disabled
            };
        }

        // Use user's iconColor if available, otherwise fall back to themeColor or defaults
        const userIconColor = userDiceConfig?.iconColor || userDiceConfig?.themeColor;

        if (userIconColor) {
            const generatedScheme = generateDiceColorScheme(userIconColor);
            return {
                default: generatedScheme.default,
                hover: generatedScheme.hover,
                disabled: generatedScheme.disabled
            };
        }

        return {
            default: DEFAULT_DICE_COLORS,
            hover: HOVER_DICE_COLORS,
            disabled: DISABLED_DICE_COLORS
        };
    }, [colors, userDiceConfig?.iconColor, userDiceConfig?.themeColor]);

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
