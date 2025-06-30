import type { UserCharacter, Race } from '@shared/prisma-client';

// Use Prisma types for the base character data
export type CharacterData = Pick<UserCharacter, 'userId' | 'name' | 'raceId' | 'alignmentId'> &
    Partial<Pick<UserCharacter, 'age' | 'height' | 'weight' | 'eyes' | 'hair' | 'gender' | 'notes'>>;

export interface CharacterQuery {
    page?: string;
    limit?: string;
    sort?: string;
    order?: string;
    name?: string;
    userId?: string;
    [key: string]: string | undefined;
}

// Use Prisma types for character with race relationship
export type CharacterWithRace = UserCharacter & {
    race: Pick<Race, 'name'> | null;
};

export interface CharacterListResponse {
    page: number;
    limit: number;
    total: number;
    results: CharacterWithRace[];
} 