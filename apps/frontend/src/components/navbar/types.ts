import type { AuthContextType } from '@/components/auth/types';

export interface EditionOption {
    value: string;
    label: string;
}

export interface NavBarProps {
    auth: AuthContextType;
}
