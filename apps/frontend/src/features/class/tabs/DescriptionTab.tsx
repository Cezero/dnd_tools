import React from 'react';
import { MarkdownEditor } from '@/components/markdown/MarkdownEditor';
import type { ClassTabProps } from './types';

export function DescriptionTab({
    formData,
    setFormData,
    validation,
    isLoading = false
}: ClassTabProps): React.JSX.Element {
    return (
        <div className="p-6 space-y-6">
            <div>
                <div className="space-y-2">
                    <MarkdownEditor
                        id="description"
                        label=""
                        value={formData.description || ''}
                        onChange={(value) => setFormData({ ...formData, description: value })}
                    />
                    {validation?.getError?.('description') && (
                        <span className="text-red-500 text-sm">{validation.getError('description')}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
