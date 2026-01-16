import { TrashIcon } from '@heroicons/react/24/outline';
import React from 'react';

import { getGroupedEntities } from './entityHelpers';
import { GroupingControls } from './GroupingControls';
import type { EntitySectionRendererProps } from './types';

export function EntitySectionRenderer({
    config,
    formData,
    hoveredIndex,
    onGroup,
    onUngroup,
    setHoveredIndex,
    preSelectedFeature,
    progression,
    editionId
}: EntitySectionRendererProps) {
    const entities = formData.entities || [];
    const groups = getGroupedEntities(entities);

    // Render groups
    return Array.from(groups.entries()).map(([groupingId, indices]) => {
        if (groupingId === 0) {
            // Render ungrouped entities individually
            return indices.map(index => (
                <React.Fragment key={index}>
                    <div className="border border-gray-200 rounded-md p-2 dark:border-gray-600">
                        <div className="flex justify-between items-center">
                            <div className="flex-1">
                                <span className="text-sm font-medium">{config.label} {index + 1}</span>
                                <config.formComponent
                                    index={index}
                                    preSelectedFeature={preSelectedFeature}
                                    progression={progression}
                                    editionId={editionId}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => config.removeFunction(index)}
                                className="text-red-500 hover:text-red-700 ml-3 flex-shrink-0"
                                title={`Remove ${config.label}`}
                            >
                                <TrashIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    {/* Group button - show between ungrouped entities, or between group and ungrouped */}
                    {(() => {
                        const nextIndex = index + 1;
                        if (nextIndex >= entities.length) return null; // Last item

                        const nextEntity = entities[nextIndex];
                        const nextGroupingId = nextEntity?.groupingId || 0;

                        // Show group button if next item is ungrouped OR if we're at the boundary between a group and ungrouped
                        if (nextGroupingId === 0) {
                            return (
                                <GroupingControls
                                    index={index}
                                    nextIndex={nextIndex}
                                    nextGroupingId={nextGroupingId}
                                    isGroupButton={true}
                                    onGroup={() => onGroup(index)}
                                    onUngroup={() => onUngroup(index)}
                                    hoveredIndex={hoveredIndex}
                                    setHoveredIndex={setHoveredIndex}
                                />
                            );
                        }
                        return null;
                    })()}
                </React.Fragment>
            ));
        } else {
            // Render grouped entities in a single wrapper
            return (
                <React.Fragment key={`group-${groupingId}`}>
                    <div className="border border-blue-400 rounded-md p-2 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20">
                        {indices.map((index, groupIndex) => (
                            <React.Fragment key={index}>
                                {/* Ungroup button - only show on boundary between grouped entities */}
                                {groupIndex > 0 && (
                                    <GroupingControls
                                        index={index}
                                        nextIndex={index}
                                        nextGroupingId={groupingId}
                                        isGroupButton={false}
                                        onGroup={() => onGroup(index)}
                                        onUngroup={() => onUngroup(index)}
                                        hoveredIndex={hoveredIndex}
                                        setHoveredIndex={setHoveredIndex}
                                    />
                                )}
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <span className="text-sm font-medium">{config.label} {index + 1}</span>
                                        <config.formComponent
                                            index={index}
                                            preSelectedFeature={preSelectedFeature}
                                            progression={progression}
                                            editionId={editionId}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => config.removeFunction(index)}
                                        className="text-red-500 hover:text-red-700 ml-3 flex-shrink-0"
                                        title={`Remove ${config.label}`}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                    {/* Group button after the group - show if next entity is ungrouped */}
                    {(() => {
                        const lastIndexInGroup = indices[indices.length - 1];
                        const nextIndex = lastIndexInGroup + 1;
                        if (nextIndex >= entities.length) return null; // Last item

                        const nextEntity = entities[nextIndex];
                        const nextGroupingId = nextEntity?.groupingId || 0;

                        // Show group button if next item is ungrouped
                        if (nextGroupingId === 0) {
                            return (
                                <GroupingControls
                                    index={lastIndexInGroup}
                                    nextIndex={nextIndex}
                                    nextGroupingId={nextGroupingId}
                                    isGroupButton={true}
                                    onGroup={() => onGroup(lastIndexInGroup)}
                                    onUngroup={() => onUngroup(lastIndexInGroup)}
                                    hoveredIndex={hoveredIndex}
                                    setHoveredIndex={setHoveredIndex}
                                />
                            );
                        }
                        return null;
                    })()}
                </React.Fragment>
            );
        }
    });
}
