import type { Feat, FeatBenefitMap, FeatPrerequisiteMap } from '@shared/prisma-client';

export interface FeatQuery {
    page?: string;
    limit?: string;
    name?: string;
    typeId?: string;
    description?: string;
    benefit?: string;
    normalEffect?: string;
    specialEffect?: string;
    prerequisites?: string;
    repeatable?: string;
    [key: string]: string | undefined;
}

// Use Prisma types for create/update operations
export type FeatCreateData = Pick<Feat, 'name' | 'typeId'> &
    Partial<Pick<Feat, 'description' | 'benefit' | 'normalEffect' | 'specialEffect' | 'prerequisites' | 'repeatable' | 'fighterBonus'>> & {
        benefits?: Array<{
            index: number;
            typeId: number;
            referenceId?: number;
            amount?: number;
        }>;
        prereqs?: Array<{
            index: number;
            typeId: number;
            referenceId?: number;
            amount?: number;
        }>;
    };

export type FeatUpdateData = FeatCreateData;

// Use Prisma types for feat with relationships
export type FeatWithRelations = Feat & {
    benefits: FeatBenefitMap[];
    prerequisitesMap: FeatPrerequisiteMap[];
};

export interface FeatListResponse {
    page: number;
    limit: number;
    total: number;
    results: FeatWithRelations[];
} 