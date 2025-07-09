import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';

import { useAuthAuto } from '@/components/auth';
import { GenericList } from '@/components/generic-list/GenericList';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { COLUMN_DEFINITIONS } from '@/features/admin/features/class-management/ClassConfig';
import { ClassService } from '@/features/admin/features/class-management/ClassService';
import { ClassFeatureService } from '@/features/admin/features/class-management/ClassFeatureService';
import { ClassQuerySchema, ClassInQueryResponse, ClassFeatureQuerySchema, ClassFeatureSchema } from '@shared/schema';
import { RPG_DICE, EDITION_MAP, ABILITY_MAP, GetSourceDisplay } from '@shared/static-data';

export default function ClassList(): React.JSX.Element {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading: isAuthLoading } = useAuthAuto();

    const HandleNewClassClick = (): void => {
        navigate('/admin/classes/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleNewClassFeatureClick = (): void => {
        navigate('/admin/classes/features/new/edit', { state: { fromListParams: location.search } });
    };

    const HandleDeleteClass = async (id: number): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this class?')) {
            try {
                await ClassService.deleteClass(undefined, { id });
            } catch (error) {
                console.error('Failed to delete class:', error);
                alert('Failed to delete class.');
            }
        }
    };

    const HandleDeleteClassFeature = async (slug: string): Promise<void> => {
        if (window.confirm('Are you sure you want to delete this class feature?')) {
            try {
                await ClassFeatureService.deleteClassFeature(undefined, { slug });
            } catch (error) {
                console.error('Failed to delete class feature:', error);
                alert('Failed to delete class feature.');
            }
        }
    };

    const RenderCell = (item: ClassInQueryResponse, columnId: string): React.ReactNode => {
        const column = COLUMN_DEFINITIONS[columnId];
        if (!column) return null;

        let cellContent: React.ReactNode = String(item[columnId as keyof ClassInQueryResponse] || '');

        if (columnId === 'name') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/classes/${item.id}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item.name}
                </a>
            );
        } else if (columnId === 'editionId') {
            cellContent = EDITION_MAP[item.editionId]?.abbreviation;
        } else if (columnId === 'isPrestige' || columnId === 'isVisible' || columnId === 'canCastSpells') {
            const value = columnId === 'isPrestige' ? item.isPrestige :
                columnId === 'isVisible' ? item.isVisible :
                    item.canCastSpells;
            cellContent = value ? 'Yes' : 'No';
        } else if (columnId === 'hitDie') {
            cellContent = `${RPG_DICE[item.hitDie]?.name || 'Unknown'}`;
        } else if (columnId === 'castingAbilityId') {
            cellContent = item.castingAbilityId ? ABILITY_MAP[item.castingAbilityId]?.name || 'Unknown' : 'None';
        } else if (columnId === 'sourceId') {
            if (item.sourceBookInfo && item.sourceBookInfo.length > 0) {
                cellContent = GetSourceDisplay(item.sourceBookInfo.map(s => ({ bookId: s.sourceBookId, pageNumber: s.pageNumber })), true);
            } else {
                cellContent = '';
            }
        }

        return cellContent;
    };

    const RenderFeatureCell = (item: z.infer<typeof ClassFeatureSchema>, columnId: string): React.ReactNode => {
        let cellContent: React.ReactNode = String(item[columnId as keyof z.infer<typeof ClassFeatureSchema>] || '');

        if (columnId === 'slug') {
            cellContent = (
                <a
                    onClick={() => navigate(`/admin/classes/features/${item.slug}`)}
                    className="text-blue-600 hover:underline cursor-pointer"
                >
                    {item.slug}
                </a>
            );
        } else if (columnId === 'description') {
            cellContent = (<ProcessMarkdown id={`class-feature-${item.slug}-description`} markdown={item.description || ''} />);
        }

        return cellContent;
    };

    if (isAuthLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Classes</h1>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewClassClick}
                    className="bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded"
                >
                    New Class
                </button>
            </div>
            <GenericList<ClassInQueryResponse>
                storageKey="classes-list"
                columnDefinitions={COLUMN_DEFINITIONS}
                querySchema={ClassQuerySchema}
                serviceFunction={ClassService.getClasses}
                renderCell={RenderCell}
                detailPagePath="/admin/classes/:id"
                itemDesc="class"
                editHandler={(item) => navigate(`/admin/classes/${item.id}/edit`)}
                deleteHandler={(item) => HandleDeleteClass(item.id)}
            />

            <h2 className="text-xl font-bold mb-4 mt-8">Class Feature Definitions</h2>
            <div className="mb-4 flex justify-end">
                <button
                    onClick={HandleNewClassFeatureClick}
                    className="bg-blue-500 hover:bg-blue-700 font-bold py-2 px-4 rounded"
                >
                    New Class Feature
                </button>
            </div>
            <GenericList<z.infer<typeof ClassFeatureSchema>>
                storageKey="class-features-list"
                columnDefinitions={{
                    slug: {
                        label: 'Feature Slug',
                        sortable: true,
                        isDefault: true,
                        isRequired: true,
                        filterConfig: {
                            type: 'text-input',
                            props: { placeholder: 'Filter by slug...' }
                        }
                    },
                    description: {
                        label: 'Description',
                        sortable: false,
                        isDefault: true,
                    },
                }}
                querySchema={ClassFeatureQuerySchema}
                serviceFunction={ClassFeatureService.getClassFeatures}
                renderCell={RenderFeatureCell}
                detailPagePath="/admin/classes/features/:slug"
                itemDesc="class feature"
                editHandler={(item: z.infer<typeof ClassFeatureSchema>) => navigate(`/admin/classes/features/${item.slug}/edit`)}
                deleteHandler={(item: z.infer<typeof ClassFeatureSchema>) => HandleDeleteClassFeature(item.slug)}
            />
        </div>
    );
}