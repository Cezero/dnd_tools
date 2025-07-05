import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { COLUMN_DEFINITIONS } from '@/features/admin/features/skill-management/SkillConfig';
import { SkillService } from '@/features/admin/features/skill-management/SkillService';
import { SkillQuerySchema, SkillResponse } from '@shared/schema';
import { ABILITY_MAP } from '@shared/static-data';

export function SkillList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();

    const HandleNewSkillClick = (): void => {
        navigate('/admin/skills/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteSkill = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this skill?')) {
            try {
                await SkillService.deleteSkill(undefined, { id });
                // Refresh the list by navigating to the same page
                navigate('/admin/skills', { replace: true });
            } catch (error) {
                console.error('Failed to delete skill:', error);
                alert('Failed to delete skill.');
            }
        }
    };

    const RenderCell = (item: SkillResponse, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = String(item[columnId as keyof SkillResponse] || '');

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
            cellContent = `${ABILITY_MAP[item.abilityId]?.abbreviation || ''}`;
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
            <GenericList<SkillResponse>
                storageKey="skills-list"
                columnDefinitions={COLUMN_DEFINITIONS}
                querySchema={SkillQuerySchema}
                serviceFunction={SkillService.getSkills}
                renderCell={RenderCell}
                detailPagePath="/admin/skills/:id"
                itemDesc="skill"
                editHandler={(item: SkillResponse) => navigate(`/admin/skills/${item.id}/edit`)}
                deleteHandler={(item: SkillResponse) => HandleDeleteSkill(item.id)}
            />
        </div>
    );
} 