import React from 'react';
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
    const { getClassNameById } = useCacheFunctions();

    if (!deity) {
        return <div>Error: Deity not found</div>;
    }

    return (
        <>
            <div className="space-y-1">
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
                    {deity.domains && deity.domains.length > 0 ? (
                        <div>
                            {deity.domains.reduce((acc, domain, index) => {
                                const link = (
                                    <Link
                                        key={domain.id}
                                        to={`/domains/${domain.id}`}
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        {domain.name}
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
                    {deity.classIds && deity.classIds.length > 0 ? (
                        <div>
                            {deity.classIds.map((classId) => {
                                const classInfo = getClassNameById(classId);
                                return (classInfo?.name || `Class ${classId}`);
                            }).join(', ')}
                        </div>
                    ) : (
                        <div className="text-gray-600 dark:text-gray-400">No typical worshipers specified.</div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-40"><strong>Favored Weapons:</strong></div>
                    {deity.favoredWeapons && deity.favoredWeapons.length > 0 ? (
                        <div>
                            {deity.favoredWeapons.map((weapon) => weapon.name).join(', ')}
                        </div>
                    ) : (
                        <div className="text-gray-600 dark:text-gray-400">No favored weapons specified.</div>
                    )}
                </div>
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
