import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { SpellService } from '@/features/spell/SpellService';
import { GetSpellResponse } from '@shared/schema';
import { SpellSchoolNameList, SpellDescriptorNameList, SpellComponentAbbrList, GetSourceDisplay, CLASS_MAP } from '@shared/static-data';

import { GetClassLevelAbbr } from './spellUtil';

export function SpellDetail(): React.JSX.Element {
    const { id } = useParams();
    const [spell, setSpell] = useState<GetSpellResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async (): Promise<void> => {
            try {
                const data = await SpellService.getSpellById(undefined, { id: parseInt(id!) });
                setSpell(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch spell:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [id, location.state]);

    const innerCellContentClasses = "p-3 bg-white dark:bg-gray-700 dark:border-gray-500 rounded-lg border w-full";
    const outerContainerClasses = "w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-500 rounded-lg shadow-lg p-1";

    if (isLoading) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Loading...
                </div>
            </div>
        </div>
    );
    if (!spell) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Spell not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <h1 className="text-2xl font-bold mb-2">{spell.name}</h1>
                    <p>
                        {spell.schoolIds && SpellSchoolNameList(spell.schoolIds.map(s => s.schoolId))}
                        {spell.subSchoolIds && (() => {
                            const subSchoolNames = SpellSchoolNameList(spell.subSchoolIds.map(s => s.subSchoolId));
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
                                {GetClassLevelAbbr(spell.levelMapping)}
                            </div>
                        </div>
                    )}

                    <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                        <ProcessMarkdown id='description' markdown={spell.description || ''} />
                    </div>
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/spells${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {isAdmin && (
                            <Link to={`/spells/${id}/edit`} state={{ fromListParams: fromListParams }} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Spell</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 