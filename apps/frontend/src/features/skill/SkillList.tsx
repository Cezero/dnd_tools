import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { createIdDeleteServiceFunction } from '@/components/generic-list/types';
import { SkillApi } from '@/features/skill/SkillApi';
import { SKILL_COLUMNS } from '@/features/skill/SkillColumns';
import { Skill } from '@shared/schema';

import { routes } from './SkillConfig';

export function SkillList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

    const HandleNewSkillClick = (): void => {
        navigate('/skills/new/edit', { state: { fromListParams: location.search } });
    };

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Skills</h1>
            {isAdmin && (
                <div className="mb-4 flex justify-end">
                    <button
                        onClick={HandleNewSkillClick}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        New Skill
                    </button>
                </div>
            )}
            <GenericList<Skill>
                storageKey="skills-list"
                columns={SKILL_COLUMNS}
                serviceFunction={() => SkillApi.getSkills({})}
                itemDesc="skill"
                routes={routes}
                deleteServiceFunction={createIdDeleteServiceFunction(SkillApi.deleteSkill)}
            />
        </div>
    );
} 
