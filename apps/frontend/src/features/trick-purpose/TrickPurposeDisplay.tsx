import React from 'react';

import { EDITION_MAP } from '@shared/static-data';

import type { TrickPurposeDisplayProps } from './types';

/**
 * Read-only Handle Animal purpose details, including the packaged trick list.
 */
export function TrickPurposeDisplay({ purpose }: TrickPurposeDisplayProps): React.JSX.Element {
    const replacesName = purpose.replacesPurposeId
        ? `Purpose #${purpose.replacesPurposeId}`
        : 'None';

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl font-bold mb-2">Description</h2>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {purpose.description || 'No description available'}
                </p>
            </div>
            <div>
                <h2 className="text-xl font-bold mb-2">Details</h2>
                <dl className="grid grid-cols-2 gap-4">
                    <div>
                        <dt className="font-semibold">DC</dt>
                        <dd>{purpose.dc}</dd>
                    </div>
                    <div>
                        <dt className="font-semibold">Training Weeks</dt>
                        <dd>{purpose.trainingWeeks}</dd>
                    </div>
                    <div>
                        <dt className="font-semibold">Edition</dt>
                        <dd>{EDITION_MAP[purpose.editionId]?.abbreviation || ''}</dd>
                    </div>
                    <div>
                        <dt className="font-semibold">Visible</dt>
                        <dd>{purpose.isVisible ? 'Yes' : 'No'}</dd>
                    </div>
                    <div>
                        <dt className="font-semibold">Replaces</dt>
                        <dd>{replacesName}</dd>
                    </div>
                </dl>
            </div>
            <div>
                <h2 className="text-xl font-bold mb-2">Tricks</h2>
                {purpose.tricks && purpose.tricks.length > 0 ? (
                    <ul className="list-disc pl-6">
                        {purpose.tricks.map((row) => (
                            <li key={row.id}>
                                {row.trick?.name ?? `Trick ${row.trickId}`}
                                {row.timesTrained > 1 ? ` ×${row.timesTrained}` : ''}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">No tricks in this package.</p>
                )}
            </div>
        </div>
    );
}
