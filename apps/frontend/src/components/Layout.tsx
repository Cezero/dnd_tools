import { ScrollArea } from '@base-ui-components/react/scroll-area';
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';

import type { AuthContextType } from '@/components/auth/types';
import { withAuthContext } from '@/components/auth/withAuth';
import { DiceBoxProvider } from '@/components/dice-box';
import { LogPanelProvider, LogPanel } from '@/components/log-panel';
import { NavBar } from '@/components/navbar';
import { MainSidebar } from '@/components/sidebar';
import { ToastProvider } from '@/components/toast';

interface LayoutProps {
    auth: AuthContextType;
}

function LayoutComponent({ auth }: LayoutProps): React.JSX.Element {
    const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);
    const [sidebarHidden, setSidebarHidden] = useState<boolean>(false);

    // Convert UserDiceConfig to UpdateUserDiceConfigRequest if valid
    const userDiceConfig = auth.userDiceConfig && auth.userDiceConfig.diceConfigBase !== null
        ? {
            diceConfigBase: auth.userDiceConfig.diceConfigBase,
            diceConfigOverrides: auth.userDiceConfig.diceConfigOverrides
        }
        : null;

    return (
        <ToastProvider>
            <LogPanelProvider>
                <DiceBoxProvider userDiceConfig={userDiceConfig}>
                    <div className="h-screen flex flex-col">
                        <NavBar />
                        <div>
                            <MainSidebar
                                isExpanded={sidebarExpanded}
                                setIsExpanded={setSidebarExpanded}
                                isHidden={sidebarHidden}
                                setIsHidden={setSidebarHidden}
                            />
                            <main className={`relative h-[calc(100vh-2.75rem)] flex flex-col transition-all duration-300 ease-in-out ${sidebarHidden ? 'ml-0' : sidebarExpanded ? 'ml-50' : 'ml-16'}`}>
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
                                <LogPanel />
                            </main>
                        </div>
                    </div>
                </DiceBoxProvider>
            </LogPanelProvider>
        </ToastProvider>
    );
}

export const Layout = withAuthContext(LayoutComponent);
