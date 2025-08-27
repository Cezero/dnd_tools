import { createContext } from 'react';

import type { LogPanelContextType } from './types';

// Create context
export const LogPanelContext = createContext<LogPanelContextType | null>(null);
