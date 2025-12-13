import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DetailPage } from '@/components/common/DetailPage';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { useCacheFunctions } from '@/services/cache';
import { SpellQueryHooks } from '@/services/query/SpellQueryHooks';
import { SpellSchoolNameList, SpellSubschoolNameList, SpellDescriptorNameList, SpellComponentAbbrList, EDITION_MAP } from '@shared/static-data';
import { GetSourceDisplay } from '@shared/utils';

import { GetClassLevelAbbr } from './spellUtil';

export function SpellDetail(): React.JSX.Element {
    const { getClassNameById } = useCacheFunctions();
    const { id } = useParams();
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';
    const [classLevelDisplay, setClassLevelDisplay] = useState<string>('');

    // Use TanStack Query hook
    const { data: spell, isLoading, error } = SpellQueryHooks.useGetSpellById(
        { pathParams: { id: parseInt(id!) } },
        { enabled: !!id }
    );

    // Handle async class level display
    useEffect(() => {
        if (spell?.levelMapping && spell.levelMapping.length > 0) {
            GetClassLevelAbbr(spell.levelMapping, { getClassNameById })
                .then(setClassLevelDisplay)
                .catch(() => setClassLevelDisplay('Error loading class levels'));
        } else {
            setClassLevelDisplay('');
        }
    }, [spell?.levelMapping, getClassNameById]);

    const handleBack = () => {
        navigate(`/spells${fromListParams ? `?${fromListParams}` : ''}`);
    };

    const handleEdit = () => {
        navigate(`/spells/${id}/edit`, { state: { fromListParams: fromListParams } });
    };

    if (error) {
        return (
            <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">Error</h1>
                <p>Failed to load spell: {error.message}</p>
            </div>
        );
    }

    return (
        <DetailPage
            isLoading={isLoading}
            item={spell}
            itemName="Spell"
            isAdmin={isAdmin}
            onBack={handleBack}
            onEdit={handleEdit}
        >
            {spell && (
                <>
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold">{spell.name}</h1>
                        <div className="text-right">
                            <p><strong>Edition:</strong> {EDITION_MAP[spell.editionId]?.abbreviation}</p>
                            {spell.sourceBookInfo && spell.sourceBookInfo.length > 0 && (
                                <p><strong>Source:</strong> {GetSourceDisplay(spell.sourceBookInfo, true)}</p>
                            )}
                        </div>
                    </div>
                    <p>
                        {spell.schoolIds && SpellSchoolNameList(spell.schoolIds.map(s => s.schoolId))}
                        {spell.subSchoolIds && (() => {
                            const subSchoolNames = SpellSubschoolNameList(spell.subSchoolIds.map(s => s.subSchoolId));
                            return subSchoolNames.length > 0 ? ` (${subSchoolNames})` : '';
                        })()}
                        {spell.descriptorIds && (() => {
                            const descriptorNames = SpellDescriptorNameList(spell.descriptorIds.map(d => d.descriptorId));
                            return descriptorNames.length > 0 ? ` [${descriptorNames}]` : '';
                        })()}
                    </p>
                    <p><strong>Level:</strong> {spell.baseLevel}</p>
                    {spell.componentIds && <p><strong>Components:</strong> {SpellComponentAbbrList(spell.componentIds.map(c => c.componentId))}</p>}
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
                                {classLevelDisplay}
                            </div>
                        </div>
                    )}

                    <div className="mt-3 p-2 w-full prose-custom">
                        <ProcessMarkdown id='description' markdown={spell.description || ''} />
                    </div>
                </>
            )}
        </DetailPage>
    );
} 
