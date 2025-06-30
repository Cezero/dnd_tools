import type { Request } from 'express';

import type { UserCharacter, Race } from '@shared/prisma-client';
import type { Prisma } from '@shared/prisma-client';
// Use Prisma types for the base character data
export type CharacterData = Pick<UserCharacter, 'userId' | 'name' | 'raceId' | 'alignmentId'> &
    Partial<Pick<UserCharacter, 'age' | 'height' | 'weight' | 'eyes' | 'hair' | 'gender' | 'notes'>>;

// Extend Prisma UserCharacter type for query parameters, making all fields optional and string-based
export type CharacterQuery = Partial<Record<keyof UserCharacter, string>> & {
    page?: string;
    limit?: string;
    sort?: string;
    order?: string;
    [key: string]: string | undefined;
};

// Request interfaces extending Express Request
export interface AllCharacterGetRequest extends Request {
    query: CharacterQuery;
}

export interface CharacterCreateRequest extends Request {
    body: CharacterData;
}

export interface CharacterUpdateRequest extends Request {
    params: { id: string };
    body: CharacterData;
}

export interface CharacterDeleteRequest extends Request {
    params: { id: string };
}

export interface CharacterGetRequest extends Request {
    params: { id: string };
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

// Service interface
export interface CharacterService {
    getAllCharacters: (query: CharacterQuery) => Promise<CharacterListResponse>;
    getCharacterById: (id: number) => Promise<CharacterWithRace | null>;
    createCharacter: (data: CharacterData) => Promise<{ id: number; message: string }>;
    updateCharacter: (id: number, data: CharacterData) => Promise<{ message: string }>;
    deleteCharacter: (id: number) => Promise<{ message: string }>;
    validateCharacterData: (data: CharacterData) => string | null;
    resolve: (characterNames: string[]) => Promise<Prisma.UserCharacterGetPayload<{
        include: {
            race: {
                select: {
                    name: true;
                };
            };
        };
    }>[]>;
} 