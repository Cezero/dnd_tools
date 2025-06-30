import { describe, it, expect, beforeEach, vi } from 'vitest';
import { raceService } from './raceService';

// Mock Prisma client
vi.mock('@shared/prisma-client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
        race: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        raceTrait: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        raceLanguageMap: {
            createMany: vi.fn(),
            deleteMany: vi.fn(),
        },
        raceAbilityAdjustment: {
            createMany: vi.fn(),
            deleteMany: vi.fn(),
        },
        raceTraitMap: {
            createMany: vi.fn(),
            deleteMany: vi.fn(),
        },
        $transaction: vi.fn(),
    })),
    Prisma: {
        RaceWhereInput: {},
        RaceTraitWhereInput: {},
    },
}));

describe('RaceService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('validateRaceData', () => {
        it('should return null for valid race data', () => {
            const validData = {
                name: 'Human',
                sizeId: 1,
                speed: 30,
                favoredClassId: 1,
                isVisible: true,
            };

            const result = raceService.validateRaceData(validData);
            expect(result).toBeNull();
        });

        it('should return error for empty name', () => {
            const invalidData = {
                name: '   ', // whitespace only
                sizeId: 1,
                speed: 30,
                favoredClassId: 1,
                isVisible: true,
            };

            const result = raceService.validateRaceData(invalidData);
            expect(result).toBe('Race name cannot be empty.');
        });

        it('should return error for invalid sizeId', () => {
            const invalidData = {
                name: 'Human',
                sizeId: -1, // negative value
                speed: 30,
                favoredClassId: 1,
                isVisible: true,
            };

            const result = raceService.validateRaceData(invalidData);
            expect(result).toBe('Size ID must be a positive integer.');
        });

        it('should return error for negative speed', () => {
            const invalidData = {
                name: 'Human',
                sizeId: 1,
                speed: -10,
                favoredClassId: 1,
                isVisible: true,
            };

            const result = raceService.validateRaceData(invalidData);
            expect(result).toBe('Speed must be non-negative.');
        });

        it('should return error for negative favoredClassId', () => {
            const invalidData = {
                name: 'Human',
                sizeId: 1,
                speed: 30,
                favoredClassId: -1,
                isVisible: true,
            };

            const result = raceService.validateRaceData(invalidData);
            expect(result).toBe('Favored class ID must be non-negative.');
        });
    });

    describe('validateRaceTraitData', () => {
        it('should return null for valid trait data', () => {
            const validData = {
                slug: 'darkvision',
                name: 'Darkvision',
                description: 'Can see in darkness',
                hasValue: false,
            };

            const result = raceService.validateRaceTraitData(validData);
            expect(result).toBeNull();
        });

        it('should return error for empty slug', () => {
            const invalidData = {
                slug: '',
                name: 'Darkvision',
                description: 'Can see in darkness',
                hasValue: false,
            };

            const result = raceService.validateRaceTraitData(invalidData);
            expect(result).toBe('Trait slug cannot be empty.');
        });

        it('should return error for invalid slug format', () => {
            const invalidData = {
                slug: 'Dark Vision',
                name: 'Darkvision',
                description: 'Can see in darkness',
                hasValue: false,
            };

            const result = raceService.validateRaceTraitData(invalidData);
            expect(result).toBe('Trait slug can only contain lowercase letters, numbers, and hyphens.');
        });
    });
}); 