import React from 'react';
import { Link } from 'react-router-dom';

import type { RevisedStatBlockProps, TrickNameLinkProps } from './types';

/**
 * Renders an Alexandrian short revised 3.5 stat block plus extras that are not
 * part of that template (role, purpose, tricks, companion specials, wild-shape notes).
 */
export function RevisedStatBlock({ model, extras }: RevisedStatBlockProps): React.JSX.Element {
    const displayName = extras.creatureName ?? extras.monsterName ?? model.header.split(' (')[0];

    return (
        <article className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-base font-semibold">
                    <Link
                        to={`/monsters/${extras.monsterId}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {displayName}
                    </Link>
                </h3>
                <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {extras.role}
                </span>
            </div>

            <div className="font-serif text-sm text-gray-900 dark:text-gray-100 space-y-1">
                <p className="font-semibold">{model.header}</p>
                {model.lines.map((line) => (
                    <p key={`${line.label}-${line.text}`}>
                        {line.label.length > 0 && (
                            <span className="font-semibold tracking-wide">{line.label} – </span>
                        )}
                        {line.text}
                    </p>
                ))}
            </div>

            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 border-t border-gray-200 dark:border-gray-600 pt-3">
                {extras.purpose && (
                    <p><span className="font-medium">Purpose:</span> {extras.purpose}</p>
                )}
                {extras.tricks.length > 0 && (
                    <p>
                        <span className="font-medium">Tricks:</span>{' '}
                        {extras.tricks.map((trick, index) => (
                            <React.Fragment key={`${trick.trickId}-${index}`}>
                                {index > 0 ? ', ' : ''}
                                <TrickNameLink trick={trick} />
                                {trick.suffix}
                            </React.Fragment>
                        ))}
                    </p>
                )}
                {extras.progression && (
                    <p><span className="font-medium">Companion:</span> {extras.progression}</p>
                )}
                {extras.specials.length > 0 && (
                    <p><span className="font-medium">Specials:</span> {extras.specials.join(', ')}</p>
                )}
                {extras.notes.map((note) => (
                    <p key={note}>{note}</p>
                ))}
            </div>
        </article>
    );
}

/**
 * Trick name that links to the trick detail page and shows the description on hover.
 */
function TrickNameLink({ trick }: TrickNameLinkProps): React.JSX.Element {
    const description = trick.description?.trim() || null;
    return (
        <span className="relative group/trick">
            <Link
                to={`/tricks/${trick.trickId}`}
                className="text-blue-600 dark:text-blue-400 hover:underline decoration-dotted underline-offset-2"
                title={description ?? undefined}
            >
                {trick.name}
            </Link>
            {description && (
                <span
                    role="tooltip"
                    className="pointer-events-none invisible group-hover/trick:visible absolute left-0 top-full z-20 mt-1 w-64 rounded bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700"
                >
                    {description}
                </span>
            )}
        </span>
    );
}
