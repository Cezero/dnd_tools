import { useParams, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProcessMarkdown from '@/components/markdown/ProcessMarkdown';
import { useAuth } from '@/auth/authProvider';
import { useNavigate } from 'react-router-dom';
import lookupService from '@/services/LookupService';
import { fetchRaceById } from '@/features/admin/features/raceMgmt/services/raceService';
import { SIZE_MAP, LANGUAGE_MAP, ATTRIBUTE_MAP } from 'shared-data/src/commonData';
import pluralize from 'pluralize';

export default function RaceDetail() {
    const { id } = useParams();
    const [race, setRace] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    useEffect(() => {
        const initialize = async () => {
            try {
                await lookupService.initialize();
                const data = await fetchRaceById(id);
                setRace(data);
                setIsLoading(false);
            } catch (error) {
                console.error('Failed to initialize or fetch race:', error);
                setIsLoading(false);
            }
        };
        initialize();
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
                        <h1 className="text-2xl font-bold">{race.race_name}</h1>
                        <div className="text-right">
                            <p><strong>Edition:</strong> {lookupService.getById('editions', race.edition_id)?.edition_abbrev}</p>
                            <p><strong>Display:</strong> {race.display ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p><strong>Size:</strong> {SIZE_MAP[race.size_id]?.name}</p>
                            <p><strong>Speed:</strong> {race.race_speed}</p>
                            <p><strong>Favored Class:</strong> {race.favored_class_id === -1 ? 'Any' : lookupService.getById('classes', race.favored_class_id)?.class_name}</p>
                        </div>
                        <div>
                            <p><strong>Languages:</strong> {race.languages && race.languages.length > 0 ? race.languages.filter(lang => lang.automatic).map(lang => LANGUAGE_MAP[lang.language_id]?.name).join(', ') : 'None'}</p>
                            <p><strong>Bonus Languages:</strong> {race.languages && race.languages.length > 0 ? race.languages.filter(lang => !lang.automatic).map(lang => LANGUAGE_MAP[lang.language_id]?.name).join(', ') : 'None'}</p>
                            <p><strong>Attribute Adjustments:</strong> {race.attribute_adjustments && race.attribute_adjustments.length > 0 ? race.attribute_adjustments.map(adj => `${ATTRIBUTE_MAP[adj.attribute_id]?.abbr} ${adj.attribute_adjustment > 0 ? '+' : ''}${adj.attribute_adjustment}`).join(', ') : 'None'}</p>
                        </div>
                    </div>
                    <div className="mt-3 p-2 w-full rounded bg-gray-50 dark:bg-gray-700 prose dark:prose-invert">
                        <ProcessMarkdown markdown={race.race_description} />
                    </div>
                    {race.traits && race.traits.length > 0 && (
                        <div className="mt-3">
                            <h3 className="text-lg font-bold mb-2">{race.race_name} Racial Traits</h3>
                            <div className="space-y-2">
                                {race.traits.map(trait => (
                                    <div key={trait.trait_slug} className="gap-2 items-start">
                                        <div className="w-full prose dark:prose-invert">
                                            <ProcessMarkdown markdown={trait.trait_description} userVars={{
                                                traitname: trait.trait_name,
                                                racename: race.race_name,
                                                racenamelower: race.race_name.toLowerCase(),
                                                raceplural: pluralize(race.race_name),
                                                raceplurallower: pluralize(race.race_name).toLowerCase(),
                                                value: trait.trait_value
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-4 text-right">
                        <button type="button" onClick={() => navigate(`/admin/races${fromListParams ? `?${fromListParams}` : ''}`)} className="inline-block px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 border dark:border-gray-500">Back to List</button>
                        {user && user.is_admin && (
                            <Link to={`/admin/races/${id}/edit`} state={{ fromListParams: fromListParams }} onClick={() => console.log('Navigating from RaceDetail to EditRace with params:', fromListParams)} className="ml-4 inline-block px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 border dark:border-gray-500">Edit Race</Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}