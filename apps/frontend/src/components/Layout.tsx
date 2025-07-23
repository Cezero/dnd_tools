import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { NavBar } from '@/components/navbar';
import { MainSidebar } from '@/components/sidebar';
import { ScrollArea } from '@base-ui-components/react/scroll-area';
import { DiceBoxProvider } from '@/components/dice-box';
import { withAuthContext } from '@/components/auth/withAuth';
import type { AuthContextType } from '@/components/auth/types';

interface LayoutProps {
    auth: AuthContextType;
}

function LayoutComponent({ auth }: LayoutProps): React.JSX.Element {
    const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);
    const [sidebarHidden, setSidebarHidden] = useState<boolean>(false);

    return (
        <DiceBoxProvider
            themeConfig={auth.diceThemeConfig}
        >
            <div className="h-screen flex flex-col">
                <NavBar />
                <div>
                    <MainSidebar
                        isExpanded={sidebarExpanded}
                        setIsExpanded={setSidebarExpanded}
                        isHidden={sidebarHidden}
                        setIsHidden={setSidebarHidden}
                    />
                    <main className={`h-[calc(100vh-2.75rem)] flex flex-col transition-all duration-300 ease-in-out ${sidebarHidden ? 'ml-0' : sidebarExpanded ? 'ml-50' : 'ml-16'}`}>
                        <ScrollArea.Root className="flex-1 overflow-hidden">
                            <ScrollArea.Viewport className="h-full" data-dice-box>
                                <ScrollArea.Content className="min-h-full">
                                    <Outlet />
                                </ScrollArea.Content>
                            </ScrollArea.Viewport>
                            <ScrollArea.Scrollbar orientation="vertical" className="Scrollbar">
                                <ScrollArea.Thumb className="Thumb" />
                            </ScrollArea.Scrollbar>
                        </ScrollArea.Root>
                    </main>
                </div>
            </div>
        </DiceBoxProvider>
    );
}

export const Layout = withAuthContext(LayoutComponent);
