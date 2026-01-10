import { PreviewCard } from '@base-ui-components/react/preview-card';
import React from 'react';

import { MonsterDisplayContent } from '@/features/monster/MonsterDisplayContent';
import { MonsterQueryHooks } from '@/services/query/MonsterQueryHooks';

import type { MonsterTooltipProps } from './types';

export function MonsterTooltip({ monsterId, children, href: _href }: MonsterTooltipProps): React.JSX.Element {
    const [isOpen, setIsOpen] = React.useState(false);

    // Fetch monster data with lazy loading (only enabled when tooltip is open)
    const { data: monster, isLoading } = MonsterQueryHooks.useGetMonsterById(
        { pathParams: { id: monsterId } },
        { enabled: isOpen }
    );

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
                            <div className="p-4">Loading monster...</div>
                        ) : monster ? (
                            <div className="max-h-96 overflow-y-auto">
                                <MonsterDisplayContent monster={monster} showHeader={false} />
                            </div>
                        ) : (
                            <div className="p-4 text-red-600 dark:text-red-400">Failed to load monster</div>
                        )}
                    </PreviewCard.Popup>
                </PreviewCard.Positioner>
            </PreviewCard.Portal>
        </PreviewCard.Root>
    );
}
