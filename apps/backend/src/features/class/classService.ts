import { PrismaClient, Prisma } from '@shared/prisma-client';

import type { ClassData, ClassService } from './types';

const prisma = new PrismaClient();

function validateClassData(classData: ClassData): string | null {
    const { name, hitDie, abbreviation, editionId } = classData;
    if (!name || name.trim() === '') {
        return 'Class name cannot be empty.';
    }
    if (!hitDie || hitDie <= 0) {
        return 'Hit die must be a positive number.';
    }
    if (!abbreviation || abbreviation.trim() === '') {
        return 'Abbreviation cannot be empty.';
    }
    if (!editionId || editionId <= 0) {
        return 'Edition ID is required.';
    }
    return null;
}

export const classService: ClassService = {
    async getAllClasses(query) {
        const { page = '1', limit = '25', sort = 'name', order = 'asc', name = '', editionId = '' } = query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const allowedSorts = ['name', 'createdAt', 'hitDie'];
        const sortBy = allowedSorts.includes(sort) ? sort : 'name';
        const sortOrder = order === 'desc' ? 'desc' : 'asc';

        const where: Prisma.ClassWhereInput = {};

        if (name) {
            where.name = { contains: name };
        }
        if (editionId) {
            where.editionId = parseInt(editionId);
        }

        const [classes, total] = await Promise.all([
            prisma.class.findMany({
                where,
                skip: offset,
                take: parseInt(limit),
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.class.count({ where }),
        ]);

        return {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            results: classes,
        };
    },

    async getClassById(id) {
        const classData = await prisma.class.findUnique({
            where: { id },
        });

        return classData;
    },

    async createClass(data) {
        const result = await prisma.class.create({
            data,
        });

        return { id: result.id, message: 'Class created successfully' };
    },

    async updateClass(id, data) {
        await prisma.class.update({
            where: { id },
            data,
        });

        return { message: 'Class updated successfully' };
    },

    async deleteClass(id) {
        await prisma.class.delete({
            where: { id },
        });

        return { message: 'Class deleted successfully' };
    },

    validateClassData,
};
