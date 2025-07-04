import { PrismaClient, Prisma } from '@shared/prisma-client';
import { ClassIdParamRequest, ClassQueryRequest, ClassResponse, CreateClassRequest, GetAllClassesResponse, UpdateClassRequest } from '@shared/schema';

import type { ClassService } from './types';

const prisma = new PrismaClient();


export const classService: ClassService = {
    async getClasses(query: ClassQueryRequest) {
        console.log('[classService] getClasses query:', query);
        const page = query.page;
        const limit = query.limit;
        const offset = (page - 1) * limit;

        const where: Prisma.ClassWhereInput = {};

        if (query.name) {
            where.name = { contains: query.name };
        }
        if (query.editionId) {
            where.editionId = query.editionId;
        }
        if (query.isPrestige !== undefined) {
            where.isPrestige = query.isPrestige;
        }
        if (query.isVisible !== undefined) {
            where.isVisible = query.isVisible;
        }
        if (query.canCastSpells !== undefined) {
            where.canCastSpells = query.canCastSpells;
        }
        if (query.hitDie) {
            where.hitDie = query.hitDie;
        }
        if (query.castingAbilityId) {
            where.castingAbilityId = query.castingAbilityId;
        }

        console.log(where);
        const [classes, total] = await Promise.all([
            prisma.class.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { name: 'asc' },
            }),
            prisma.class.count({ where }),
        ]);

        return {
            page,
            limit,
            total,
            results: classes,
        };
    },

    async getAllClasses() {
        const classes = await prisma.class.findMany() as GetAllClassesResponse;
        return classes;
    },

    async getClassById(query: ClassIdParamRequest) {
        const classData = await prisma.class.findUnique({
            where: { id: query.id },
        });

        return classData as ClassResponse;
    },

    async createClass(data: CreateClassRequest) {
        const result = await prisma.class.create({
            data,
        });

        return { id: result.id, message: 'Class created successfully' };
    },

    async updateClass(query: ClassIdParamRequest, data: UpdateClassRequest) {
        await prisma.class.update({
            where: { id: query.id },
            data,
        });

        return { message: 'Class updated successfully' };
    },

    async deleteClass(query: ClassIdParamRequest) {
        await prisma.class.delete({
            where: { id: query.id },
        });

        return { message: 'Class deleted successfully' };
    },
};
