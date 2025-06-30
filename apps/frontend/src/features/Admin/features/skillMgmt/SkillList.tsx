import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GenericList } from '@/components/GenericList/GenericList';
import { COLUMN_DEFINITIONS, DEFAULT_COLUMNS, SkillFilterOptions } from '@/features/admin/features/skillMgmt/SkillConfig';
import { FetchSkills, DeleteSkill } from '@/features/admin/features/skillMgmt/SkillService';
import { UseAuth } from '@/components/auth/AuthProvider';
import { ABILITY_MAP } from '@shared/static-data';
import type { Skill } from '@shared/prisma-client';

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
        return { data, total };
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

    const RenderCell = (item: Skill, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = String(item[columnId as keyof Skill] || '');

        if (columnId === 'name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/skills/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item.name}
                </a>
            );
        } else if (columnId === 'abilityId') {
            cellContent = `${ABILITY_MAP[item.abilityId]?.abbr || ''}`;
        } else if (columnId === 'trainedOnly') {
            cellContent = item.trainedOnly ? 'Yes' : 'No';
        } else if (columnId === 'affectedByArmor') {
            cellContent = item.affectedByArmor ? 'Yes' : 'No';
        } else if (columnId === 'checkDescription') {
            cellContent = item.checkDescription || '';
        } else if (columnId === 'actionDescription') {
            cellContent = item.actionDescription || '';
        } else if (columnId === 'retryTypeId') {
            cellContent = item.retryTypeId ? 'Yes' : 'No';
        } else if (columnId === 'retryDescription') {
            cellContent = item.retryDescription || '';
        } else if (columnId === 'specialNotes') {
            cellContent = item.specialNotes || '';
        } else if (columnId === 'synergyNotes') {
            cellContent = item.synergyNotes || '';
        } else if (columnId === 'untrainedNotes') {
            cellContent = item.untrainedNotes || '';
        } else if (columnId === 'description') {
            cellContent = item.description || '';
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
            <GenericList<Skill>
                storageKey="skills-list"
                defaultColumns={DEFAULT_COLUMNS}
                requiredColumnId="name"
                columnDefinitions={COLUMN_DEFINITIONS}
                fetchData={skillFetchData}
                renderCell={RenderCell}
                detailPagePath="/admin/skills/:id"
                idKey="id"
                refreshTrigger={refreshTrigger}
                itemDesc="skill"
                editHandler={(item: Skill) => navigate(`/admin/skills/${item.id}/edit`)}
                deleteHandler={(item: Skill) => HandleDeleteSkill(item.id)}
                filterOptions={memoizedSkillFilterOptions}
            />
        </div>
    );
} 