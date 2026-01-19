import React from 'react';

import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';

import { ClassEditStateUpdateType } from '../types';
import type { ClassTabProps } from './types';

export function DescriptionTab({
    state,
    updateState,
    validation,
    isLoading: _isLoading = false
}: ClassTabProps): React.JSX.Element {
    return (
        <div className="p-6 space-y-6">
            <div>
                <div className="space-y-2">
                    <MarkdownEditor
                        id="description"
                        label=""
                        value={state.description || ''}
                        onChange={(value) => updateState({ type: ClassEditStateUpdateType.SET_DESCRIPTION, payload: { description: value || null } })}
                    />
                    {validation?.getError?.('description') && (
                        <span className="text-red-500 text-sm">{validation.getError('description')}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
