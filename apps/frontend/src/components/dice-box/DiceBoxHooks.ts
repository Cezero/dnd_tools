import { createContext, useContext } from 'react';

import type { DiceBoxContextType } from './types';

export const DiceBoxContext = createContext<DiceBoxContextType | null>(null);

// Hook to use DiceBox context
export function useDiceBox(): DiceBoxContextType {
    const context = useContext(DiceBoxContext);
    if (!context) {
        throw new Error('useDiceBox must be used within DiceBoxProvider');
    }
    return context;
}
