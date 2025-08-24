import React from 'react';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import type { RaceTabProps } from './types';

export function DescriptionTab({
    formData,
    setFormData,
    validation,
    isLoading = false
}: RaceTabProps): React.JSX.Element {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Provide a detailed description of this race. You can use markdown formatting for rich text.
                </p>

                <div className="space-y-2">
                    <MarkdownEditor
                        id="description"
                        value={formData.description || ''}
                        onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    />
                    {validation?.getError?.('description') && (
                        <span className="text-red-500 text-sm">{validation.getError('description')}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
