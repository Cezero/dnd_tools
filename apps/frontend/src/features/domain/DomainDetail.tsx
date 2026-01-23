import { useParams, useLocation, useNavigate } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { DomainDisplay } from '@/features/domain/DomainDisplay';

import { DomainQueryHooks } from './DomainQueryHooks';

export function DomainDetail() {
    const { id } = useParams();
    const { isAdmin } = useAuthAuto();
    const navigate = useNavigate();
    const location = useLocation();
    const fromListParams = location.state?.fromListParams || '';

    // Use TanStack Query hook
    const { data: domain, isLoading } = DomainQueryHooks.useGetDomainById({
        pathParams: { id: parseInt(id!) },
        enabled: !!id
    });

    if (isLoading) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    Loading...
                </div>
            </div>
        </div>
    );

    if (!domain) return (
        <div className="pt-8">
            <div className="w-4/5 mx-auto border-2 border-gray-400 dark:border-gray-600 rounded-lg shadow-lg p-1">
                <div className="p-3 bg-content border-content rounded-lg border w-full">
                    Domain not found
                </div>
            </div>
        </div>
    );

    return (
        <DomainDisplay
            domain={domain}
            showHeader={true}
            showActions={true}
            onBack={() => navigate(`/domains${fromListParams ? `?${fromListParams}` : ''}`)}
            onEdit={() => navigate(`/domains/${id}/edit`, { state: { fromListParams: fromListParams } })}
            isAdmin={isAdmin}
            fromListParams={fromListParams}
        />
    );
}
