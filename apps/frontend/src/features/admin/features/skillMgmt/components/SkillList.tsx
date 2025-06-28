import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GenericList } from '@/components/GenericList/GenericList';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS, SkillFilterOptions } from '@/features/admin/features/skillMgmt/config/SkillConfig';
import { FetchSkills, DeleteSkill } from '@/features/admin/features/skillMgmt/services/SkillService';
import { UseAuth } from '@/auth/AuthProvider';
import { ABILITY_MAP } from '@shared/static-data/AbilityData';

export function SkillList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoading: isAuthLoading } = UseAuth();
    const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

    const memoizedSkillFilterOptions = useMemo(() => (
        SkillFilterOptions
    ), []);

    const skillFetchData = useCallback(async (params: URLSearchParams) => {
        const { data, total } = await FetchSkills(params);
        const processedResults = data.map((skill: any) => ({
            skill_name: skill.skill_name,
            ability_id: skill.ability_id,
            trained_only: skill.trained_only,
            skill_armor_check_penalty: skill.skill_armor_check_penalty,
            skill_abbr: skill.skill_abbr,
            skill_check: skill.skill_check,
            skill_action: skill.skill_action,
            skill_try_again: skill.skill_try_again,
            skill_try_again_desc: skill.skill_try_again_desc,
            skill_special: skill.skill_special,
            skill_synergy_desc: skill.skill_synergy_desc,
            untrained_desc: skill.untrained_desc,
            skill_description: skill.skill_description,
            id: skill.skill_id
        }));
        return { data: processedResults, total: total };
    }, [user]);

    const HandleNewSkillClick = (): void => {
        navigate('/admin/skills/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteSkill = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this skill?')) {
            try {
                await DeleteSkill(id);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error('Failed to delete skill:', error);
                alert('Failed to delete skill.');
            }
        }
    };

    const RenderCell = (item: any, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = item[columnId];

        if (columnId === 'skill_name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/skills/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item[columnId]}
                </a>
            );
        } else if (columnId === 'ability_id') {
            cellContent = `${ABILITY_MAP[item[columnId]].abbr}`;
        } else if (columnId === 'trained_only' || columnId === 'skill_armor_check_penalty' || columnId === 'skill_try_again') {
            cellContent = item[columnId] ? 'Yes' : 'No';
        }

        return cellContent;
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
            <GenericList
                storageKey="skills-list"
                defaultColumns={DEFAULT_COLUMNS}
                requiredColumnId="skill_name"
                columnDefinitions={COLUMN_DEFINITIONS}
                fetchData={skillFetchData}
                renderCell={RenderCell}
                detailPagePath="/admin/skills/:id"
                idKey="id"
                refreshTrigger={refreshTrigger}
                itemDesc="skill"
                editHandler={(item: any) => navigate(`/admin/skills/${item.id}/edit`)}
                deleteHandler={(item: any) => HandleDeleteSkill(item.id)}
                filterOptions={memoizedSkillFilterOptions}
            />
        </div>
    );
} 