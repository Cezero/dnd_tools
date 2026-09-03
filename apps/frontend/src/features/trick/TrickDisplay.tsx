import React from 'react';

import { getSourceDisplay } from '@/services/cache';
import { EDITION_MAP } from '@shared/static-data';

import type { TrickDisplayProps } from './types';

/**
 * Read-only trick details: description, teaching DC, edition, visibility, and source books.
 */
export function TrickDisplay({ trick }: TrickDisplayProps): React.JSX.Element {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-bold mb-2">Description</h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {trick.description || 'No description available'}
                </p>
            </div>
            <div>
                <h2 className="text-xl font-bold mb-2">Details</h2>
                <dl className="grid grid-cols-2 gap-4">
                    <div>
                        <dt className="font-semibold">DC</dt>
                        <dd>{trick.dc}</dd>
                    </div>
                    <div>
                        <dt className="font-semibold">Max Times Trainable</dt>
                        <dd>{trick.maxTimesTrainable}</dd>
                    </div>
                    <div>
                        <dt className="font-semibold">Edition</dt>
                        <dd>{EDITION_MAP[trick.editionId]?.abbreviation || ''}</dd>
                    </div>
                    <div>
                        <dt className="font-semibold">Visible</dt>
                        <dd>{trick.isVisible ? 'Yes' : 'No'}</dd>
                    </div>
                    {trick.sourceBookInfo && trick.sourceBookInfo.length > 0 && (
                        <div>
                            <dt className="font-semibold">Source</dt>
                            <dd>{getSourceDisplay(trick.sourceBookInfo, true)}</dd>
                        </div>
                    )}
                </dl>
            </div>
        </div>
    );
}
