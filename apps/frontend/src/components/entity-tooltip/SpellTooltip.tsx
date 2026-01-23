import { PreviewCard } from '@base-ui-components/react/preview-card';
import React from 'react';

import { SpellDisplayContent } from '@/features/spell/SpellDisplayContent';
import { SpellQueryHooks } from '@/features/spell/SpellQueryHooks';
import { GetClassLevelAbbr } from '@/features/spell/spellUtil';

import type { SpellTooltipProps } from './types';

export function SpellTooltip({ spellId, children, href: _href }: SpellTooltipProps): React.JSX.Element {
    const [classLevelDisplay, setClassLevelDisplay] = React.useState<string>('');
    const [isOpen, setIsOpen] = React.useState(false);

    // Fetch spell data with lazy loading (only enabled when tooltip is open)
    const { data: spell, isLoading } = SpellQueryHooks.useGetSpellById(
        { pathParams: { id: spellId } },
        { enabled: isOpen }
    );

    // Handle class level display
    React.useEffect(() => {
        if (spell?.levelMapping && spell.levelMapping.length > 0) {
            const display = GetClassLevelAbbr(spell.levelMapping);
            setClassLevelDisplay(display);
        } else {
            setClassLevelDisplay('');
        }
    }, [spell?.levelMapping]);

    return (
        <PreviewCard.Root open={isOpen} onOpenChange={setIsOpen}>
            <PreviewCard.Trigger
                render={(props) => {
                    if (React.isValidElement(children)) {
                        return React.cloneElement(children, props);
                    }
                    return <span {...props}>{children}</span>;
                }}
            />
            <PreviewCard.Portal>
                <PreviewCard.Positioner sideOffset={8}>
                    <PreviewCard.Popup className="max-w-md p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                        {isLoading ? (
                            <div className="p-4">Loading spell...</div>
                        ) : spell ? (
                            <div className="max-h-96 overflow-y-auto">
                                <SpellDisplayContent spell={spell} showHeader={false} classLevelDisplay={classLevelDisplay} />
                            </div>
                        ) : (
                            <div className="p-4 text-red-600 dark:text-red-400">Failed to load spell</div>
                        )}
                    </PreviewCard.Popup>
                </PreviewCard.Positioner>
            </PreviewCard.Portal>
        </PreviewCard.Root>
    );
}
