import React from 'react';

import { ValidatedInput, SourceEditor } from '@/components/forms';
import { CustomCheckbox, CustomSelect } from '@/components/forms/FormComponents';
import { EDITION_LIST, SourceType, EditionId } from '@shared/static-data';

import { RaceEditStateUpdateType } from '../types';
import type { RaceTabProps } from './types';


export function BasicInfoTab({
    state,
    updateState,
    isLoading: _isLoading = false
}: RaceTabProps): React.JSX.Element {
    return (
        <div className="p-6 space-y-6">
            <div>
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 w-full">
                        <ValidatedInput
                            field="name"
                            label="Name"
                            type="text"
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-30"
                            inputExtraClassName="w-auto"
                            required
                            placeholder="e.g., Human, Elf, Dwarf"
                            data-1p-ignore
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex flex-col justify-end">
                            <CustomSelect
                                label="Edition"
                                required
                                componentExtraClassName="flex items-center gap-2"
                                labelExtraClassName="w-2/7"
                                itemExtraClassName="w-24"
                                itemTextExtraClassName="w-16"
                                value={state.editionId}
                                onValueChange={(value) => updateState({ type: RaceEditStateUpdateType.SET_EDITION_ID, payload: { editionId: value as number } })}
                                options={EDITION_LIST}
                                placeholder="Select edition"
                                useAbbreviation={true}
                            />
                            <CustomCheckbox
                                label="Visible in Lists"
                                checked={state.isVisible}
                                onCheckedChange={(checked) => updateState({ type: RaceEditStateUpdateType.SET_IS_VISIBLE, payload: { isVisible: checked } })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Source References */}
            <div>
                <SourceEditor
                    sources={state.sourceBookInfo || []}
                    onSourcesChange={(sources) => updateState({ type: RaceEditStateUpdateType.SET_SOURCE_BOOK_INFO, payload: { sourceBookInfo: sources || null } })}
                    sourceType={SourceType.Races}
                    editionId={state.editionId as EditionId}
                />
            </div>
        </div>
    );
}
