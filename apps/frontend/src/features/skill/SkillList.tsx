import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list';
import { createIdDeleteServiceFunction } from '@/components/generic-list/types';
import { SKILL_COLUMNS } from '@/features/skill/SkillColumns';
import { SkillQueryHooks } from '@/services/query/SkillQueryHooks';
import { Skill } from '@shared/schema';

import { routes } from './SkillConfig';

export function SkillList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading, isAdmin } = useAuthAuto();

    // Use the delete mutation hook
    const { mutate: deleteSkillMutation } = SkillQueryHooks.useDeleteSkill();

    // Create a wrapper function for the delete operation
    const deleteSkill = async (params: undefined, idParams: { id: number }) => {
        return new Promise((resolve, reject) => {
            deleteSkillMutation(
                { pathParams: { id: idParams.id } },
                {
                    onSuccess: () => resolve(undefined),
                    onError: (error) => reject(error)
                }
            );
        });
    };

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
                queryHook={SkillQueryHooks.useGetSkills}
                itemDesc="skill"
                routes={routes}
                deleteServiceFunction={createIdDeleteServiceFunction(deleteSkill)}
            />
        </div>
    );
} 
