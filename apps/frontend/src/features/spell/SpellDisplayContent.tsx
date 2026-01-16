import React from 'react';

import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { formatSpellSchool, formatSpellComponents, formatSpellDescriptors } from '@/lib/formatters';
import { getSourceDisplay } from '@/services/cache';
import { EDITION_MAP } from '@shared/static-data';

import type { SpellDisplayContentProps } from './types';

export function SpellDisplayContent({ spell, showHeader = false, classLevelDisplay }: SpellDisplayContentProps): React.JSX.Element | null {
    if (!spell) {
        return null;
    }

    return (
        <>
            {showHeader && (
                <div className="flex justify-between items-start mb-2">
                    <h1 className="text-2xl font-bold">{spell.name}</h1>
                    <div className="text-right">
                        <p><strong>Edition:</strong> {EDITION_MAP[spell.editionId]?.abbreviation}</p>
                        {spell.sourceBookInfo && spell.sourceBookInfo.length > 0 && (
                            <p><strong>Source:</strong> {getSourceDisplay(spell.sourceBookInfo, true)}</p>
                        )}
                    </div>
                </div>
            )}
            <p>
                {formatSpellSchool(spell, { useAbbreviation: false, includeBrackets: false })}
                {spell.descriptorIds && (() => {
                    const descriptorNames = formatSpellDescriptors(spell);
                    return descriptorNames.length > 0 ? ` [${descriptorNames}]` : '';
                })()}
            </p>
            <p><strong>Level:</strong> {spell.baseLevel}</p>
            {spell.componentIds && <p><strong>Components:</strong> {formatSpellComponents(spell)}</p>}
            {spell.castingTime && <p><strong>Casting Time:</strong> {spell.castingTime}</p>}
            {spell.effect && <p><strong>Effect:</strong> {spell.effect}</p>}
            {spell.area && <p><strong>Area:</strong> {spell.area}</p>}
            {spell.range && <p><strong>Range:</strong> {spell.range}</p>}
            {spell.target && <p><strong>Target:</strong> {spell.target}</p>}
            {spell.duration && <p><strong>Duration:</strong> {spell.duration}</p>}
            {spell.savingThrow && <p><strong>Saving Throw:</strong> {spell.savingThrow}</p>}
            {spell.spellResistance && <p><strong>Spell Resistance:</strong> {spell.spellResistance}</p>}

            {/* Class Level Mappings */}
            {spell.levelMapping && spell.levelMapping.length > 0 && (
                <div className="mt-3">
                    <p><strong>Class Levels:</strong></p>
                    <div className="ml-4">
                        {classLevelDisplay || 'Loading...'}
                    </div>
                </div>
            )}

            <div className="mt-3 p-2 w-full prose-custom">
                <ProcessMarkdown id='description' markdown={spell.description || ''} />
            </div>
        </>
    );
}
