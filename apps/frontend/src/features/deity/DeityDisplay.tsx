import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { useCacheFunctions } from '@/services/cache';
import { Deity } from '@shared/schema';
import { EDITION_MAP, ALIGNMENT_MAP, PANTHEON_MAP } from '@shared/static-data';
import { GetSourceDisplay } from '@shared/utils';

interface DeityDisplayProps {
    deity: Deity;
    showHeader?: boolean;
}

export function DeityDisplay({ deity, showHeader = true }: DeityDisplayProps) {
    const { getClassNameById, getRaceNameById, getItemNameFromCache, getDomainNameFromCache } = useCacheFunctions();
    const [worshiperNames, setWorshiperNames] = useState<string>('');
    const [imageExists, setImageExists] = useState<boolean>(false);
    const [imageError, setImageError] = useState<boolean>(false);

    // Generate image path from deity name
    const getImagePath = (deityName: string): string => {
        let imageName = deityName.toLowerCase();
        // Replace spaces with underscores
        imageName = imageName.replace(/\s+/g, '_');
        // Replace hyphens with underscores
        imageName = imageName.replace(/-/g, '_');
        // Remove other punctuation (periods, commas, etc.)
        // eslint-disable-next-line no-useless-escape
        imageName = imageName.replace(/[.,;:!?'"()\[\]{}]/g, '');
        return `/assets/artwork/deities/${imageName}.jpeg`;
    };

    // Check if image exists
    useEffect(() => {
        if (!deity?.name) {
            setImageExists(false);
            return;
        }

        const imagePath = getImagePath(deity.name);
        const img = new Image();

        img.onload = () => {
            setImageExists(true);
            setImageError(false);
        };

        img.onerror = () => {
            setImageExists(false);
            setImageError(true);
        };

        img.src = imagePath;
    }, [deity?.name]);

    useEffect(() => {
        const hasClasses = deity?.classIds && deity.classIds.length > 0;
        const hasRaces = deity?.raceIds && deity.raceIds.length > 0;

        if (!hasClasses && !hasRaces) {
            setWorshiperNames('');
            return;
        }

        const loadWorshipperNames = async () => {
            try {
                const names: string[] = [];

                // Load class names
                if (hasClasses) {
                    const classNames = await Promise.all(
                        deity.classIds.map(async (classId) => {
                            const classInfo = getClassNameById(classId);
                            return classInfo?.name || `Class ${classId}`;
                        })
                    );
                    names.push(...classNames);
                }

                // Load race names
                if (hasRaces) {
                    const raceNames = await Promise.all(
                        deity.raceIds.map(async (raceId) => {
                            const raceInfo = getRaceNameById(raceId);
                            return raceInfo?.name || `Race ${raceId}`;
                        })
                    );
                    names.push(...raceNames);
                }

                setWorshiperNames(names.join(', '));
            } catch {
                setWorshiperNames('Error loading worshipers');
            }
        };

        loadWorshipperNames();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deity?.classIds, deity?.raceIds]);

    if (!deity) {
        return <div>Error: Deity not found</div>;
    }

    const imagePath = deity?.name ? getImagePath(deity.name) : '';

    return (
        <>
            {showHeader && (
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h1 className="text-2xl font-bold">{deity.name}</h1>
                        {deity.title && (
                            <p className="text-lg text-gray-600 dark:text-gray-400 italic">{deity.title}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p><strong>Edition:</strong> {EDITION_MAP[deity.editionId]?.abbreviation || deity.editionId}</p>
                        {deity.sourceBookInfo && deity.sourceBookInfo.length > 0 && (
                            <p><strong>Source:</strong> {GetSourceDisplay(deity.sourceBookInfo, true)}</p>
                        )}
                    </div>
                </div>
            )}

            <div className="flex gap-6 items-start">
                <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-40"><strong>Alignment:</strong></div>
                        <div>{ALIGNMENT_MAP[deity.alignmentId]?.name || deity.alignmentId}</div>
                    </div>

                    {deity.pantheonId && (
                        <div className="flex items-center gap-2">
                            <div className="w-40"><strong>Pantheon:</strong></div>
                            <div>{PANTHEON_MAP[deity.pantheonId]?.name || deity.pantheonId}</div>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <div className="w-40"><strong>Associated Domains:</strong></div>
                        {deity.domainIds && deity.domainIds.length > 0 ? (
                            <div>
                                {deity.domainIds.reduce((acc, domainId, index) => {
                                    const domainName = getDomainNameFromCache(domainId) || `Domain ${domainId}`;
                                    const link = (
                                        <Link
                                            key={domainId}
                                            to={`/domains/${domainId}`}
                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {domainName}
                                        </Link>
                                    );
                                    return index === 0 ? [link] : [...acc, ', ', link];
                                }, [] as React.ReactNode[])}
                            </div>
                        ) : (
                            <div className="text-gray-600 dark:text-gray-400">No associated domains.</div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-40"><strong>Typical Worshipers:</strong></div>
                        {(deity.classIds && deity.classIds.length > 0) || (deity.raceIds && deity.raceIds.length > 0) ? (
                            <div>{worshiperNames || 'Loading...'}</div>
                        ) : (
                            <div className="text-gray-600 dark:text-gray-400">No typical worshipers specified.</div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-40"><strong>Favored Weapons:</strong></div>
                        {deity.favoredWeaponIds && deity.favoredWeaponIds.length > 0 ? (
                            <div>
                                {deity.favoredWeaponIds.map((itemId) => getItemNameFromCache(itemId) || `Item ${itemId}`).join(', ')}
                            </div>
                        ) : (
                            <div className="text-gray-600 dark:text-gray-400">No favored weapons specified.</div>
                        )}
                    </div>
                </div>

                {imageExists && (
                    <div className="flex-shrink-0">
                        <img
                            src={imagePath}
                            alt={deity.name}
                            className="max-w-[240px] max-h-[192px] object-contain rounded"
                            onError={() => {
                                setImageError(true);
                                setImageExists(false);
                            }}
                        />
                    </div>
                )}
                {!imageExists && imageError && (
                    <div className="flex-shrink-0 text-xs text-gray-500">
                        Debug: Image not found at {imagePath}
                    </div>
                )}
            </div>

            <div className="mt-4">
                <div><strong className="text-lg">Description</strong></div>
                <div className="prose max-w-none">
                    <ProcessMarkdown markdown={deity.description || 'No description available.'} id={`${deity.name.toLowerCase()}-deity-description`} />
                </div>
            </div>
        </>
    );
}
