import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { useAuthAuto } from '@/components/auth';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { RaceService } from '@/features/admin/features/race-management/RaceService';
import { GetRaceResponseSchema } from '@shared/schema';
import { SIZE_MAP, LANGUAGE_MAP, EDITION_MAP, ABILITY_MAP, CLASS_MAP } from '@shared/static-data';


type RaceWithTraitsResponse = z.infer<typeof GetRaceResponseSchema>;
import pluralize from 'pluralize';

export function RaceDetail() {
    const { id } = useParams();
    const [race, setRace] = useState<RaceWithTraitsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const Initialize = async () => {
            try {
                const data = await RaceService.getRaceById(undefined, { id: parseInt(id!) });
                setRace(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch race:', error);
                setIsLoading(false);
            }
        };
        Initialize();
    }, [id, location.state]);

    // Inner cell styling (the inner border, padding, background, text colors)
    const innerCellContentClasses = "p-3 bg-white dark:bg-gray-700 dark:border-gray-500 rounded-lg border w-full";

    // Outer container styling (width, centering, outer border, shadow)
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
    if (!race) return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    Race not found
                </div>
            </div>
        </div>
    );

    return (
        <div className="pt-8">
            <div className={outerContainerClasses}>
                <div className={innerCellContentClasses}>
                    <div className="flex justify-between items-start mb-2">
                        <h1 className="text-2xl font-bold">{race.name}</h1>
                        <div className="text-right">
                            <p><strong>Edition:</strong> {EDITION_MAP[race.editionId]?.abbreviation}</p>
                            <p><strong>Display:</strong> {race.isVisible ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p><strong>Size:</strong> {SIZE_MAP[race.sizeId]?.name}</p>
                            <p><strong>Speed:</strong> {race.speed}</p>
                            <p><strong>Favored Class:</strong> {race.favoredClassId === -1 ? 'Any' : CLASS_MAP[race.favoredClassId]?.name}</p>
                        </div>
                        <div>
                            <p><strong>Languages:</strong> {race.languages && race.languages.length > 0 ? race.languages.filter(lang => lang.isAutomatic).map(lang => LANGUAGE_MAP[lang.languageId]?.name).join(', ') : 'None'}</p>
                            <p><strong>Bonus Languages:</strong> {race.languages && race.languages.length > 0 ? race.languages.filter(lang => !lang.isAutomatic).map(lang => LANGUAGE_MAP[lang.languageId]?.name).join(', ') : 'None'}</p>
                            <p><strong>Ability Adjustments:</strong> {race.abilityAdjustments && race.abilityAdjustments.length > 0 ? race.abilityAdjustments.map(adj => `${ABILITY_MAP[adj.abilityId]?.abbreviation} ${adj.value > 0 ? '+' : ''}${adj.value}`).join(', ') : 'None'}</p>
                        </div>
                    </div>
                    <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                        <ProcessMarkdown markdown={race.description || ''} />
                    </div>
                    {race.traits && race.traits.length > 0 && (
                        <div className="mt-3">
                            <h3 className="text-lg font-bold mb-2">{race.name} Racial Traits</h3>
                            <div className="space-y-2">
                                {race.traits.map(trait => (
                                    <div key={trait.traitSlug} className="gap-2 items-start">
                                        <div className="w-full prose dark:prose-invert">
                                            <ProcessMarkdown markdown={trait.trait?.description || ''} userVars={{
                                                racename: race.name,
                                                racenamelower: race.name.toLowerCase(),
                                                raceplural: pluralize(race.name),
                                                raceplurallower: pluralize(race.name).toLowerCase(),
                                                value: trait.value
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/races${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {isAdmin && (
                            <Link to={`/admin/races/${id}/edit`} state={{ fromListParams: fromListParams }} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Race</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}