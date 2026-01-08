import React from 'react';
import { Trick } from '@shared/schema';

interface TrickDisplayProps {
    trick: Trick;
}

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
                        <dt className="font-semibold">Edition ID</dt>
                        <dd>{trick.editionId}</dd>
                    </div>
                    <div>
                        <dt className="font-semibold">Visible</dt>
                        <dd>{trick.isVisible ? 'Yes' : 'No'}</dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}

