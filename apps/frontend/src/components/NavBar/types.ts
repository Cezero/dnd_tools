import type { WithAuthProps } from '@/components/auth/withAuth';

export interface EditionOption {
    value: string;
    label: string;
}

export interface NavBarProps extends WithAuthProps {
    // Add any other props your navbar needs
} 