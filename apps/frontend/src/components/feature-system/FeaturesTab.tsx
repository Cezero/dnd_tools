import React, { useState } from 'react';
import { TrashIcon } from '@heroicons/react/24/outline';
import { formatProgression, formatPrerequisites, formatWildShapeProgressions, expandFormulaProgressions } from '@/lib/Formatters';
import { FormulaCalculator } from '@/lib/formulaCalculator';
import { renderCellValue } from '@/components/generic-list/columnUtils';
import { FeatureProgressionWithRelations } from '@shared/schema';
import { SpecialFeatureId, ModifierAppliesToType, ModifierType, FeatureModifierConditionType, SIZE_SELECT_LIST } from '@shared/static-data';
import { FeatureSelectionDialog } from '@/components/feature-system';

interface FeaturesTabProps {
    // Common props
    featureProgressions: FeatureProgressionWithRelations[];
    onEditProgression: (progression: FeatureProgressionWithRelations) => void;
    onRemoveProgression: (progressionId: number) => void;
    onAddFeature: (feature: { id: number; name: string; description: string; slug: string }) => void;

    // Context-specific props
    contextType: 'class' | 'race';
    contextId: number;

    // Special feature filtering
    excludeSpecialFeatures?: SpecialFeatureId[];

    // Dialog state management
    setEditingProgression: (progression: FeatureProgressionWithRelations | null) => void;
    setPreSelectedFeature: (feature: any) => void;
    setIsProgressionDialogOpen: (open: boolean) => void;
}

export function FeaturesTab({
    featureProgressions = [],
    onEditProgression,
    onRemoveProgression,
    onAddFeature,
    contextType,
    contextId,
    excludeSpecialFeatures = [],
    setEditingProgression,
    setPreSelectedFeature,
    setIsProgressionDialogOpen
}: FeaturesTabProps): React.JSX.Element {
    const [isFeatureSelectionOpen, setIsFeatureSelectionOpen] = useState(false);

    // Group progressions by feature, excluding special features based on context
    const featuresByFeature = featureProgressions
        .filter(progression => !excludeSpecialFeatures.includes(progression.featureId))
        .reduce((acc, progression) => {
            const featureId = progression.featureId;
            if (!acc[featureId]) {
                acc[featureId] = {
                    feature: progression.feature,
                    progressions: []
                };
            }
            acc[featureId].progressions.push(progression);
            return acc;
        }, {} as Record<number, { feature: any; progressions: FeatureProgressionWithRelations[] }>);

    // Sort features by name
    const sortedFeatures = Object.values(featuresByFeature).sort((a, b) =>
        (a.feature?.name || '').localeCompare(b.feature?.name || '')
    );

    const handleEditProgression = (progression: FeatureProgressionWithRelations) => {
        if (onEditProgression) {
            onEditProgression(progression);
        }
    };

    const handleRemoveProgression = (progressionId: number) => {
        if (onRemoveProgression) {
            onRemoveProgression(progressionId);
        }
    };

    const handleFeatureSelected = (feature: { id: number; name: string; description: string; slug: string }) => {
        if (onAddFeature) {
            onAddFeature(feature);
        }
    };

    // Get context-specific title and empty state message
    const getContextSpecificText = () => {
        switch (contextType) {
            case 'class':
                return {
                    title: 'Class Features',
                    emptyMessage: 'No features associated with this class'
                };
            case 'race':
                return {
                    title: 'Race Features',
                    emptyMessage: 'No features associated with this race'
                };
            default:
                return {
                    title: 'Features',
                    emptyMessage: 'No features associated'
                };
        }
    };

    const { title, emptyMessage } = getContextSpecificText();

    return (
        <>
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button
                        type="button"
                        onClick={() => {
                            setIsFeatureSelectionOpen(true);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Add Feature
                    </button>
                </div>

                {sortedFeatures.length > 0 ? (
                    <div className="space-y-4">
                        {sortedFeatures.map(({ feature, progressions }) => {
                            // Check if this is a wild shape feature
                            const isWildShape = feature?.name?.toLowerCase().includes('wild shape');

                            // Group progressions by level for wild shape features
                            const progressionsByLevel = isWildShape ?
                                (() => {
                                    // Expand formula-based progressions
                                    const expandedProgressions = expandFormulaProgressions(progressions);
                                    return expandedProgressions.reduce((acc, progression) => {
                                        const level = progression.level;
                                        if (!acc[level]) {
                                            acc[level] = [];
                                        }
                                        acc[level].push(progression);
                                        return acc;
                                    }, {} as Record<number, FeatureProgressionWithRelations[]>);
                                })() :
                                null;

                            return (
                                <div key={feature?.id || 'unknown'} className="border border-gray-200 rounded-md dark:border-gray-600">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-700">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="text-lg font-medium">
                                                    {feature?.name || `Feature ${feature?.id || 'Unknown'}`}
                                                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                                        ({feature?.slug || `feature-${feature?.id || 'unknown'}`})
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Show prerequisites if they exist */}
                                            {feature.prerequisites && feature.prerequisites.length > 0 && (
                                                <div className="ml-4 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-md flex-shrink-0">
                                                    <p className="text-xs text-slate-700 dark:text-slate-300">
                                                        <strong>Prerequisites:</strong> {formatPrerequisites(feature.prerequisites)}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        {/* Show feature description */}
                                        {feature?.description && (
                                            <div className="mt-2">
                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                    {renderCellValue(
                                                        feature.description,
                                                        { truncate: 300, isMarkdown: true },
                                                        `feature-${feature?.id || 'unknown'}-description`
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Feature Progressions */}
                                    <div className="p-2">
                                        <div className="flex flex-wrap gap-2 items-start">
                                            {isWildShape && progressionsByLevel ? (
                                                // Special formatting for wild shape features
                                                Object.entries(progressionsByLevel)
                                                    .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                                    .map(([level, levelProgressions]) => {
                                                        const wildShapeDetails = formatWildShapeProgressions(levelProgressions);
                                                        return (
                                                            <div key={level} className="flex items-start gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEditProgression(levelProgressions[0])}
                                                                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-left"
                                                                    title="Edit progression details"
                                                                >
                                                                    Level {level}{wildShapeDetails ? ` (${wildShapeDetails})` : ''}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveProgression(levelProgressions[0].id)}
                                                                    className="text-red-500 hover:text-red-700"
                                                                    title="Remove Progression"
                                                                >
                                                                    <TrashIcon className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        );
                                                    })
                                            ) : (
                                                // Regular formatting for other features
                                                progressions.map((progression: FeatureProgressionWithRelations, progIndex: number) => (
                                                    <div key={progIndex} className="flex items-start gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditProgression(progression)}
                                                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-left"
                                                            title="Edit progression details"
                                                        >
                                                            {(() => {
                                                                // Special handling for damage dice replacement modifiers
                                                                const hasDamageDiceReplacement = progression.modifiers?.some(mod =>
                                                                    (mod.appliesTo === (ModifierAppliesToType as any).UnarmedDamage || mod.appliesTo === ModifierAppliesToType.Damage) &&
                                                                    mod.type === ModifierType.Replacement
                                                                );

                                                                if (hasDamageDiceReplacement) {
                                                                    // For damage dice, show each modifier with its conditions
                                                                    const damageModifiers = progression.modifiers?.filter(mod =>
                                                                        (mod.appliesTo === (ModifierAppliesToType as any).UnarmedDamage || mod.appliesTo === ModifierAppliesToType.Damage) &&
                                                                        mod.type === ModifierType.Replacement
                                                                    ) || [];

                                                                    if (damageModifiers.length > 0) {
                                                                        const damageDetails: string[] = [];

                                                                        for (const damageModifier of damageModifiers) {
                                                                            // Create a single progression with just this damage modifier
                                                                            const singleModifierProgression = {
                                                                                ...progression,
                                                                                modifiers: [damageModifier]
                                                                            };

                                                                            // Use formatProgression on this single modifier progression
                                                                            const formatted = formatProgression(singleModifierProgression);
                                                                            if (formatted.value) {
                                                                                // Check if this modifier has size conditions
                                                                                const sizeCondition = damageModifier.conditions?.find(cond =>
                                                                                    cond.conditionType === FeatureModifierConditionType.character_size
                                                                                );

                                                                                if (sizeCondition && sizeCondition.conditionValue !== null) {
                                                                                    // Get the size name from SIZE_SELECT_LIST
                                                                                    const sizeName = SIZE_SELECT_LIST.find(size =>
                                                                                        size.value === sizeCondition.conditionValue
                                                                                    )?.label || sizeCondition.conditionValue;

                                                                                    damageDetails.push(`Size: ${sizeName} - ${formatted.value}`);
                                                                                } else {
                                                                                    // Default modifier (no size condition)
                                                                                    damageDetails.push(formatted.value);
                                                                                }
                                                                            }
                                                                        }

                                                                        if (damageDetails.length > 0) {
                                                                            return `Level ${progression.level} (${damageDetails.join(', ')})`;
                                                                        }
                                                                    }
                                                                }

                                                                // Use normal formatting for other modifiers
                                                                const formatted = formatProgression(progression);
                                                                if (formatted.label === '') {
                                                                    // Formula-based progression - return the raw value without wrapping
                                                                    return formatted.value;
                                                                } else {
                                                                    // Regular progression - wrap with level and details
                                                                    const details = [];
                                                                    if (formatted.value) details.push(formatted.value);
                                                                    if (formatted.note) details.push(formatted.note);
                                                                    return `Level ${progression.level}${details.length > 0 ? ` (${details.join(', ')})` : ''}`;
                                                                }
                                                            })()}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveProgression(progression.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                            title="Remove Progression"
                                                        >
                                                            <TrashIcon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingProgression?.(null);
                                                    setPreSelectedFeature?.(feature);
                                                    setIsProgressionDialogOpen?.(true);
                                                }}
                                                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                            >
                                                Add Progression
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-md dark:border-gray-600">
                        {emptyMessage}
                    </div>
                )}
            </div>

            {/* Feature Selection Dialog */}
            <FeatureSelectionDialog
                isOpen={isFeatureSelectionOpen}
                onClose={() => setIsFeatureSelectionOpen(false)}
                onFeatureSelected={handleFeatureSelected}
                classId={contextType === 'class' ? contextId : undefined}
                raceId={contextType === 'race' ? contextId : undefined}
            />
        </>
    );
}
