import React from 'react';

import {
    ValidatedInput,
    CustomSelect,
    CustomCheckbox,
    SourceEditor
} from '@/components/forms';
import {
    EDITION_LIST,
    EditionId,
    SourceType,
} from '@shared/static-data';

import { ClassEditStateUpdateType } from '../types';
import type { ClassTabProps } from './types';

export function BasicInfoTab({
    state,
    updateState,
    isLoading: _isLoading = false
}: ClassTabProps): React.JSX.Element {
    return (
        <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Basic Info */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <ValidatedInput
                            field="name"
                            label="Class Name"
                            type="text"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            inputExtraClassName="w-32"
                            data-1p-ignore
                        />
                        <ValidatedInput
                            field="abbreviation"
                            label="Abbreviation"
                            type="text"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-45"
                            inputExtraClassName="w-32"
                        />
                    </div>
                </div>

                {/* Right Column - Edition and Checkboxes */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <CustomSelect
                            label="Edition"
                            required
                            componentExtraClassName="flex items-center gap-2"
                            labelExtraClassName="w-32"
                            itemExtraClassName="w-32"
                            itemTextExtraClassName="w-32"
                            value={state.editionId}
                            onValueChange={(value) => updateState({ type: ClassEditStateUpdateType.SET_EDITION_ID, payload: { editionId: value as number } })}
                            options={EDITION_LIST}
                            useAbbreviation={true}
                            placeholder="Select edition"
                        />
                        <CustomCheckbox
                            label="Prestige Class"
                            checked={state.isPrestige}
                            onCheckedChange={(checked) => updateState({ type: ClassEditStateUpdateType.SET_IS_PRESTIGE, payload: { isPrestige: checked } })}
                        />
                        <CustomCheckbox
                            label="Visible in Lists"
                            checked={state.isVisible}
                            onCheckedChange={(checked) => updateState({ type: ClassEditStateUpdateType.SET_IS_VISIBLE, payload: { isVisible: checked } })}
                        />
                        <CustomCheckbox
                            label="Can Cast Spells"
                            checked={state.canCastSpells}
                            onCheckedChange={(checked) => updateState({ type: ClassEditStateUpdateType.SET_CAN_CAST_SPELLS, payload: { canCastSpells: checked } })}
                        />
                        {state.canCastSpells && (
                            <CustomCheckbox
                                label="Divine Caster"
                                checked={state.isDivine}
                                onCheckedChange={(checked) => updateState({ type: ClassEditStateUpdateType.SET_IS_DIVINE, payload: { isDivine: checked } })}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Source References - moved to bottom */}
            <div className="mt-8">
                <SourceEditor
                    sources={state.sourceBookInfo || []}
                    onSourcesChange={(sources) => {
                        updateState({ type: ClassEditStateUpdateType.SET_SOURCE_BOOK_INFO, payload: { sourceBookInfo: sources.length > 0 ? sources : null } });
                    }}
                    sourceType={SourceType.Classes}
                    editionId={state.editionId as EditionId}
                />
            </div>
        </div>
    );
}
