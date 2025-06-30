import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetSkills, GetAllSkills, GetSkillById, CreateSkill, UpdateSkill, DeleteSkill } from './skillController';

// Mock Prisma client
vi.mock('@shared/prisma-client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
        skill: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
    })),
    Prisma: {
        SkillWhereInput: {},
    },
}));

describe('SkillController', () => {
    let mockPrisma: any;
    let mockRequest: any;
    let mockResponse: any;

    beforeEach(() => {
        vi.clearAllMocks();
        const { PrismaClient } = require('@shared/prisma-client');
        mockPrisma = new PrismaClient();

        mockRequest = {
            query: {},
            params: {},
            body: {},
        };

        mockResponse = {
            json: vi.fn(),
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        };
    });

    describe('GetSkills', () => {
        it('should return paginated skills with default parameters', async () => {
            const mockSkills = [
                { id: 1, name: 'Acrobatics', abilityId: 2 },
                { id: 2, name: 'Athletics', abilityId: 1 },
            ];

            mockPrisma.skill.findMany.mockResolvedValue(mockSkills);
            mockPrisma.skill.count.mockResolvedValue(2);

            await GetSkills(mockRequest, mockResponse);

            expect(mockPrisma.skill.findMany).toHaveBeenCalledWith({
                where: {},
                skip: 0,
                take: 10,
                orderBy: { name: 'asc' },
            });
            expect(mockResponse.json).toHaveBeenCalledWith({
                page: 1,
                limit: 10,
                total: 2,
                results: mockSkills,
            });
        });

        it('should apply filters when query parameters are provided', async () => {
            mockRequest.query = {
                page: '2',
                limit: '5',
                name: 'Athletics',
                abilityId: '1',
                trainedOnly: 'true',
                affectedByArmor: 'false',
            };

            const mockSkills = [{ id: 1, name: 'Athletics', abilityId: 1 }];
            mockPrisma.skill.findMany.mockResolvedValue(mockSkills);
            mockPrisma.skill.count.mockResolvedValue(1);

            await GetSkills(mockRequest, mockResponse);

            expect(mockPrisma.skill.findMany).toHaveBeenCalledWith({
                where: {
                    name: { contains: 'Athletics' },
                    abilityId: 1,
                    trainedOnly: true,
                    affectedByArmor: false,
                },
                skip: 5,
                take: 5,
                orderBy: { name: 'asc' },
            });
        });

        it('should handle errors gracefully', async () => {
            mockPrisma.skill.findMany.mockRejectedValue(new Error('Database error'));

            await GetSkills(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.send).toHaveBeenCalledWith('Server error');
        });
    });

    describe('GetAllSkills', () => {
        it('should return all skills with id and name only', async () => {
            const mockSkills = [
                { id: 1, name: 'Acrobatics' },
                { id: 2, name: 'Athletics' },
            ];

            mockPrisma.skill.findMany.mockResolvedValue(mockSkills);

            await GetAllSkills(mockRequest, mockResponse);

            expect(mockPrisma.skill.findMany).toHaveBeenCalledWith({
                select: {
                    id: true,
                    name: true,
                },
                orderBy: { name: 'asc' },
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockSkills);
        });

        it('should handle errors gracefully', async () => {
            mockPrisma.skill.findMany.mockRejectedValue(new Error('Database error'));

            await GetAllSkills(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.send).toHaveBeenCalledWith('Server error');
        });
    });

    describe('GetSkillById', () => {
        it('should return a skill when found', async () => {
            const mockSkill = { id: 1, name: 'Acrobatics', abilityId: 2 };
            mockRequest.params = { id: '1' };

            mockPrisma.skill.findUnique.mockResolvedValue(mockSkill);

            await GetSkillById(mockRequest, mockResponse);

            expect(mockPrisma.skill.findUnique).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(mockResponse.json).toHaveBeenCalledWith(mockSkill);
        });

        it('should return 404 when skill not found', async () => {
            mockRequest.params = { id: '999' };
            mockPrisma.skill.findUnique.mockResolvedValue(null);

            await GetSkillById(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith('Skill not found');
        });

        it('should handle errors gracefully', async () => {
            mockRequest.params = { id: '1' };
            mockPrisma.skill.findUnique.mockRejectedValue(new Error('Database error'));

            await GetSkillById(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.send).toHaveBeenCalledWith('Server error');
        });
    });

    describe('CreateSkill', () => {
        it('should create a skill successfully', async () => {
            const skillData = {
                name: 'New Skill',
                abilityId: 1,
                trainedOnly: false,
                affectedByArmor: false,
            };
            mockRequest.body = skillData;

            const createdSkill = { id: 1, ...skillData };
            mockPrisma.skill.create.mockResolvedValue(createdSkill);

            await CreateSkill(mockRequest, mockResponse);

            expect(mockPrisma.skill.create).toHaveBeenCalledWith({
                data: skillData,
            });
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith({
                id: 1,
                message: 'Skill created successfully',
            });
        });

        it('should handle errors gracefully', async () => {
            mockRequest.body = { name: 'Test' };
            mockPrisma.skill.create.mockRejectedValue(new Error('Database error'));

            await CreateSkill(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.send).toHaveBeenCalledWith('Server error');
        });
    });

    describe('UpdateSkill', () => {
        it('should update a skill successfully', async () => {
            const skillData = { name: 'Updated Skill' };
            mockRequest.params = { id: '1' };
            mockRequest.body = skillData;

            const updatedSkill = { id: 1, ...skillData };
            mockPrisma.skill.update.mockResolvedValue(updatedSkill);

            await UpdateSkill(mockRequest, mockResponse);

            expect(mockPrisma.skill.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: skillData,
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith({
                message: 'Skill updated successfully',
            });
        });

        it('should return 404 when skill not found', async () => {
            mockRequest.params = { id: '999' };
            mockRequest.body = { name: 'Test' };

            const notFoundError = new Error('Record to update not found');
            mockPrisma.skill.update.mockRejectedValue(notFoundError);

            await UpdateSkill(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith('Skill not found or no changes made');
        });

        it('should handle other errors gracefully', async () => {
            mockRequest.params = { id: '1' };
            mockRequest.body = { name: 'Test' };
            mockPrisma.skill.update.mockRejectedValue(new Error('Database error'));

            await UpdateSkill(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.send).toHaveBeenCalledWith('Server error');
        });
    });

    describe('DeleteSkill', () => {
        it('should delete a skill successfully', async () => {
            mockRequest.params = { id: '1' };
            mockPrisma.skill.delete.mockResolvedValue({ id: 1 });

            await DeleteSkill(mockRequest, mockResponse);

            expect(mockPrisma.skill.delete).toHaveBeenCalledWith({
                where: { id: 1 },
            });
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.send).toHaveBeenCalledWith('Skill deleted successfully');
        });

        it('should return 404 when skill not found', async () => {
            mockRequest.params = { id: '999' };

            const notFoundError = new Error('Record to delete does not exist');
            mockPrisma.skill.delete.mockRejectedValue(notFoundError);

            await DeleteSkill(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.send).toHaveBeenCalledWith('Skill not found');
        });

        it('should handle other errors gracefully', async () => {
            mockRequest.params = { id: '1' };
            mockPrisma.skill.delete.mockRejectedValue(new Error('Database error'));

            await DeleteSkill(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.send).toHaveBeenCalledWith('Server error');
        });
    });
}); 