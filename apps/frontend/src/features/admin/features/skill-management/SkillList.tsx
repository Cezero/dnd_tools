import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { SKILL_COLUMNS } from '@/features/admin/features/skill-management/SkillColumns';
import { SkillService } from '@/features/admin/features/skill-management/SkillService';
import { SkillInQueryResponse } from '@shared/schema';
import { routes } from './SkillConfig';

export function SkillList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    const HandleNewSkillClick = (): void => {
        navigate('/admin/skills/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteSkill = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this skill?')) {
            try {
                await SkillService.deleteSkill(undefined, { id });
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete skill:', error);
                alert('Failed to delete skill.');
            }
        }
    };

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Skills</h1>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewSkillClick}
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                    New Skill
                </button>
            </div>
            <GenericList<SkillInQueryResponse>
                storageKey="skills-list"
                columns={SKILL_COLUMNS}
                serviceFunction={() => SkillService.getSkills({})}
                itemDesc="skill"
                routes={routes}
            />
        </div>
    );
} 
