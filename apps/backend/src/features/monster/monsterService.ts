import { PrismaClient } from '@shared/prisma-client';
import type {
    MonsterIdParamRequest,
    UpdateMonsterRequest,
    GetMonsterResponse,
    GetAllMonstersResponse,
    MonsterHierarchyEntry,
    MonsterCacheResponse,
    UpdateResponse,
} from '@shared/schema';

import type { MonsterService } from './types';

const prisma = new PrismaClient();

// Helper function to recursively traverse baseMonsterId chain
// Returns hierarchy in order: most base first, variant last
async function getMonsterHierarchy(
    baseMonsterId: number | null
): Promise<MonsterHierarchyEntry[]> {
    if (!baseMonsterId) {
        return [];
    }

    const hierarchy: MonsterHierarchyEntry[] = [];
    let currentId: number | null = baseMonsterId;
    let level = 0;

    // Traverse up the chain to find the root
    const chain: Array<{ id: number; baseMonsterId: number | null }> = [];
    while (currentId) {
        const monster: { id: number; baseMonsterId: number | null } | null = await prisma.monster.findUnique({
            where: { id: currentId },
            select: {
                id: true,
                baseMonsterId: true,
            },
        });

        if (!monster) {
            break;
        }

        chain.push(monster);
        currentId = monster.baseMonsterId;
    }

    // Now traverse back down to build hierarchy (most base first)
    for (let i = chain.length - 1; i >= 0; i--) {
        const monsterId = chain[i].id;
        const monster = await prisma.monster.findUnique({
            where: { id: monsterId },
            include: {
                extraDescriptions: true,
                specialAbilities: {
                    include: {
                        ability: true,
                    },
                },
            },
        });

        if (monster) {
            hierarchy.push({
                id: monster.id,
                name: monster.name,
                level: level++,
                description: monster.description || null,
                combatDescription: monster.combatDescription || null,
                flavorText: monster.flavorText || null,
                extraDescriptions: monster.extraDescriptions.map(ed => ({
                    id: ed.id,
                    type: ed.type,
                    description: ed.description || null,
                })),
                specialAbilities: monster.specialAbilities.map(sa => ({
                    abilityId: sa.abilityId,
                    ability: sa.ability ? {
                        id: sa.ability.id,
                        name: sa.ability.name,
                        description: sa.ability.description,
                        abilityType: sa.ability.abilityType,
                        effectiveCasterLevel: sa.ability.effectiveCasterLevel,
                        saveAbility: sa.ability.saveAbility,
                    } : null,
                })),
            });
        }
    }

    return hierarchy;
}

export const monsterService: MonsterService = {
    async getAllMonsters(includeStatblockOnly: boolean = false, typeId?: number): Promise<GetAllMonstersResponse> {
        const whereClause: Record<string, unknown> = {};

        if (includeStatblockOnly) {
            // Filter to only monsters with statblock elements
            whereClause.OR = [
                { sizeId: { not: null } },
                { armorClass: { not: null } },
                { hitDiceQty: { not: null } },
                { baseSpeed: { not: null } },
                { baseAttack: { not: null } },
                { fortSave: { not: null } },
                { refSave: { not: null } },
                { willSave: { not: null } },
            ];
        }

        if (typeId !== undefined) {
            whereClause.types = {
                some: {
                    typeId: typeId,
                },
            };
        }

        const monsters = await prisma.monster.findMany({
            where: whereClause,
            include: {
                types: {
                    select: {
                        typeId: true,
                    },
                },
                subtypes: {
                    select: {
                        subtypeId: true,
                    },
                },
                skills: true,
                feats: true,
                specialAbilities: {
                    include: {
                        ability: true,
                    },
                },
                armorBreakdown: true,
                equipment: {
                    select: {
                        itemId: true,
                    },
                },
                spells: {
                    include: {
                        spell: true,
                        specialAbility: true,
                    },
                },
                preparedSpellSlots: true,
                extraHitDice: true,
                alternateSpeeds: true,
                domains: {
                    select: {
                        domainId: true,
                    },
                },
                extraDescriptions: true,
                sourceBookInfo: {
                    select: {
                        sourceBookId: true,
                        pageNumber: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        // Transform Prisma results to match schema
        const transformedMonsters = monsters.map(monster => ({
            id: monster.id,
            name: monster.name,
            baseMonsterId: monster.baseMonsterId,
            editionId: monster.editionId,
            isVisible: monster.isVisible,
            flavorText: monster.flavorText,
            description: monster.description,
            combatDescription: monster.combatDescription,
            sizeId: monster.sizeId,
            baseSpeed: monster.baseSpeed,
            armorClass: monster.armorClass,
            touchAC: monster.touchAC,
            flatFootedAC: monster.flatFootedAC,
            hitDiceQty: monster.hitDiceQty,
            hitDiceType: monster.hitDiceType,
            bonusHP: monster.bonusHP,
            averageHP: monster.averageHP,
            initiative: monster.initiative,
            baseAttack: monster.baseAttack,
            grapple: monster.grapple,
            attack: monster.attack,
            fullAttack: monster.fullAttack,
            space: monster.space,
            reach: monster.reach,
            optionalReach: monster.optionalReach,
            optionalReachDescription: monster.optionalReachDescription,
            fortSave: monster.fortSave,
            refSave: monster.refSave,
            willSave: monster.willSave,
            strength: monster.strength,
            dexterity: monster.dexterity,
            constitution: monster.constitution,
            intelligence: monster.intelligence,
            wisdom: monster.wisdom,
            charisma: monster.charisma,
            organization: monster.organization,
            treasure: monster.treasure,
            alignment: monster.alignment,
            advancement: monster.advancement,
            challengeRating: monster.challengeRating,
            levelAdjustment: monster.levelAdjustment,
            specialAttacks: monster.specialAttacks,
            specialQualities: monster.specialQualities,
            types: monster.types.map(t => ({ typeId: t.typeId })),
            subtypes: monster.subtypes.map(s => ({ subtypeId: s.subtypeId })),
            skills: monster.skills.map(s => ({
                id: s.id,
                skillId: s.skillId,
                skillSubId: s.skillSubId,
                ranks: s.ranks,
                notes: s.notes,
            })),
            feats: monster.feats.map(f => ({
                id: f.id,
                featId: f.featId,
                notes: f.notes,
            })),
            specialAbilities: monster.specialAbilities.map(sa => ({
                abilityId: sa.abilityId,
                ability: sa.ability ? {
                    id: sa.ability.id,
                    name: sa.ability.name,
                    description: sa.ability.description,
                    abilityType: sa.ability.abilityType,
                    effectiveCasterLevel: sa.ability.effectiveCasterLevel,
                    saveAbility: sa.ability.saveAbility,
                } : null,
            })),
            armorBreakdown: monster.armorBreakdown.map(ab => ({
                id: ab.id,
                componentType: ab.componentType,
                value: ab.value,
                equipmentItemId: ab.equipmentItemId,
                description: ab.description,
            })),
            equipment: monster.equipment.map(e => ({
                itemId: e.itemId,
            })),
            spells: monster.spells.map(s => ({
                id: s.id,
                spellId: s.spellId,
                spellType: s.spellType,
                quantity: s.quantity,
                usesPerDayId: s.usesPerDayId,
                saveDC: s.saveDC,
                level: s.level,
                specialAbilityId: s.specialAbilityId,
                notes: s.notes,
            })),
            preparedSpellSlots: monster.preparedSpellSlots.map(ps => ({
                id: ps.id,
                spellLevel: ps.spellLevel,
                numSlots: ps.numSlots,
            })),
            extraHitDice: monster.extraHitDice.map(ehd => ({
                id: ehd.id,
                hitDiceQty: ehd.hitDiceQty,
                hitDiceType: ehd.hitDiceType,
                bonusHP: ehd.bonusHP,
            })),
            alternateSpeeds: monster.alternateSpeeds.map(as => ({
                id: as.id,
                movementTypeId: as.movementTypeId,
                speed: as.speed,
                maneuverability: as.maneuverability,
            })),
            domains: monster.domains.map(d => ({
                domainId: d.domainId,
            })),
            extraDescriptions: monster.extraDescriptions.map(ed => ({
                id: ed.id,
                type: ed.type,
                description: ed.description,
            })),
            sourceBookInfo: monster.sourceBookInfo.map(sb => ({
                sourceBookId: sb.sourceBookId,
                pageNumber: sb.pageNumber,
            })),
        }));

        return {
            total: transformedMonsters.length,
            results: transformedMonsters,
        };
    },

    async getMonsterById(id: MonsterIdParamRequest): Promise<GetMonsterResponse | null> {
        const monster = await prisma.monster.findUnique({
            where: { id: id.id },
            include: {
                types: {
                    select: {
                        typeId: true,
                    },
                },
                subtypes: {
                    select: {
                        subtypeId: true,
                    },
                },
                skills: true,
                feats: true,
                specialAbilities: {
                    include: {
                        ability: true,
                    },
                },
                armorBreakdown: true,
                equipment: {
                    select: {
                        itemId: true,
                    },
                },
                spells: {
                    include: {
                        spell: true,
                        specialAbility: true,
                    },
                },
                preparedSpellSlots: true,
                extraHitDice: true,
                alternateSpeeds: true,
                domains: {
                    select: {
                        domainId: true,
                    },
                },
                extraDescriptions: true,
                sourceBookInfo: {
                    select: {
                        sourceBookId: true,
                        pageNumber: true,
                    },
                },
            },
        });

        if (!monster) {
            return null;
        }

        // Get hierarchy data
        const hierarchyData = await getMonsterHierarchy(monster.baseMonsterId);

        // Transform Prisma result to match schema
        const transformedMonster: GetMonsterResponse = {
            name: monster.name,
            baseMonsterId: monster.baseMonsterId,
            editionId: monster.editionId,
            isVisible: monster.isVisible,
            flavorText: monster.flavorText,
            description: monster.description,
            combatDescription: monster.combatDescription,
            sizeId: monster.sizeId,
            baseSpeed: monster.baseSpeed,
            armorClass: monster.armorClass,
            touchAC: monster.touchAC,
            flatFootedAC: monster.flatFootedAC,
            hitDiceQty: monster.hitDiceQty,
            hitDiceType: monster.hitDiceType,
            bonusHP: monster.bonusHP,
            averageHP: monster.averageHP,
            initiative: monster.initiative,
            baseAttack: monster.baseAttack,
            grapple: monster.grapple,
            attack: monster.attack,
            fullAttack: monster.fullAttack,
            space: monster.space,
            reach: monster.reach,
            optionalReach: monster.optionalReach,
            optionalReachDescription: monster.optionalReachDescription,
            fortSave: monster.fortSave,
            refSave: monster.refSave,
            willSave: monster.willSave,
            strength: monster.strength,
            dexterity: monster.dexterity,
            constitution: monster.constitution,
            intelligence: monster.intelligence,
            wisdom: monster.wisdom,
            charisma: monster.charisma,
            organization: monster.organization,
            treasure: monster.treasure,
            alignment: monster.alignment,
            advancement: monster.advancement,
            challengeRating: monster.challengeRating,
            levelAdjustment: monster.levelAdjustment,
            specialAttacks: monster.specialAttacks,
            specialQualities: monster.specialQualities,
            types: monster.types.map(t => ({ typeId: t.typeId })),
            subtypes: monster.subtypes.map(s => ({ subtypeId: s.subtypeId })),
            skills: monster.skills.map(s => ({
                id: s.id,
                skillId: s.skillId,
                skillSubId: s.skillSubId,
                ranks: s.ranks,
                notes: s.notes,
            })),
            feats: monster.feats.map(f => ({
                id: f.id,
                featId: f.featId,
                notes: f.notes,
            })),
            specialAbilities: monster.specialAbilities.map(sa => ({
                abilityId: sa.abilityId,
                ability: sa.ability ? {
                    id: sa.ability.id,
                    name: sa.ability.name,
                    description: sa.ability.description,
                    abilityType: sa.ability.abilityType,
                    effectiveCasterLevel: sa.ability.effectiveCasterLevel,
                    saveAbility: sa.ability.saveAbility,
                } : null,
            })),
            armorBreakdown: monster.armorBreakdown.map(ab => ({
                id: ab.id,
                componentType: ab.componentType,
                value: ab.value,
                equipmentItemId: ab.equipmentItemId,
                description: ab.description,
            })),
            equipment: monster.equipment.map(e => ({
                itemId: e.itemId,
            })),
            spells: monster.spells.map(s => ({
                id: s.id,
                spellId: s.spellId,
                spellType: s.spellType,
                quantity: s.quantity,
                usesPerDayId: s.usesPerDayId,
                saveDC: s.saveDC,
                level: s.level,
                specialAbilityId: s.specialAbilityId,
                notes: s.notes,
            })),
            preparedSpellSlots: monster.preparedSpellSlots.map(ps => ({
                id: ps.id,
                spellLevel: ps.spellLevel,
                numSlots: ps.numSlots,
            })),
            extraHitDice: monster.extraHitDice.map(ehd => ({
                id: ehd.id,
                hitDiceQty: ehd.hitDiceQty,
                hitDiceType: ehd.hitDiceType,
                bonusHP: ehd.bonusHP,
            })),
            alternateSpeeds: monster.alternateSpeeds.map(as => ({
                id: as.id,
                movementTypeId: as.movementTypeId,
                speed: as.speed,
                maneuverability: as.maneuverability,
            })),
            domains: monster.domains.map(d => ({
                domainId: d.domainId,
            })),
            extraDescriptions: monster.extraDescriptions.map(ed => ({
                id: ed.id,
                type: ed.type,
                description: ed.description,
            })),
            sourceBookInfo: monster.sourceBookInfo.map(sb => ({
                sourceBookId: sb.sourceBookId,
                pageNumber: sb.pageNumber,
            })),
            hierarchyData: hierarchyData.length > 0 ? hierarchyData : null,
        };

        return transformedMonster;
    },

    async getMonsterHierarchy(baseMonsterId: number): Promise<MonsterHierarchyEntry[]> {
        return getMonsterHierarchy(baseMonsterId);
    },

    async updateMonster(id: MonsterIdParamRequest, data: UpdateMonsterRequest): Promise<UpdateResponse> {
        await prisma.$transaction(async (tx) => {
            // Delete all relationship mappings
            await tx.monsterTypeMap.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterSubtypeMap.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterSkillMap.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterFeatMap.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterSpecialAbilityMap.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterArmorBreakdown.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterEquipment.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterSpell.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterPreparedSpellSlots.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterExtraHitDie.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterAlternateSpeed.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterDomainMap.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterExtraDescription.deleteMany({ where: { monsterId: id.id } });
            await tx.monsterSourceMap.deleteMany({ where: { monsterId: id.id } });

            // Prepare update data
            const updateData: Record<string, unknown> = {
                ...data,
            };

            // Remove relationship fields from update data
            delete updateData.types;
            delete updateData.subtypes;
            delete updateData.skills;
            delete updateData.feats;
            delete updateData.specialAbilities;
            delete updateData.armorBreakdown;
            delete updateData.equipment;
            delete updateData.spells;
            delete updateData.preparedSpellSlots;
            delete updateData.extraHitDice;
            delete updateData.alternateSpeeds;
            delete updateData.domains;
            delete updateData.extraDescriptions;
            delete updateData.sourceBookInfo;

            // Update core monster fields
            await tx.monster.update({
                where: { id: id.id },
                data: updateData,
            });

            // Recreate relationship mappings
            if (data.types) {
                await tx.monsterTypeMap.createMany({
                    data: data.types.map(t => ({
                        monsterId: id.id,
                        typeId: t.typeId,
                    })),
                });
            }

            if (data.subtypes) {
                await tx.monsterSubtypeMap.createMany({
                    data: data.subtypes.map(s => ({
                        monsterId: id.id,
                        subtypeId: s.subtypeId,
                    })),
                });
            }

            if (data.skills) {
                await tx.monsterSkillMap.createMany({
                    data: data.skills.map(s => ({
                        monsterId: id.id,
                        skillId: s.skillId,
                        skillSubId: s.skillSubId,
                        ranks: s.ranks,
                        notes: s.notes,
                    })),
                });
            }

            if (data.feats) {
                await tx.monsterFeatMap.createMany({
                    data: data.feats.map(f => ({
                        monsterId: id.id,
                        featId: f.featId,
                        notes: f.notes,
                    })),
                });
            }

            if (data.specialAbilities) {
                await tx.monsterSpecialAbilityMap.createMany({
                    data: data.specialAbilities.map(sa => ({
                        monsterId: id.id,
                        abilityId: sa.abilityId,
                    })),
                });
            }

            if (data.armorBreakdown) {
                await tx.monsterArmorBreakdown.createMany({
                    data: data.armorBreakdown.map(ab => ({
                        monsterId: id.id,
                        componentType: ab.componentType,
                        value: ab.value,
                        equipmentItemId: ab.equipmentItemId,
                        description: ab.description,
                    })),
                });
            }

            if (data.equipment) {
                await tx.monsterEquipment.createMany({
                    data: data.equipment.map(e => ({
                        monsterId: id.id,
                        itemId: e.itemId,
                    })),
                });
            }

            if (data.spells) {
                await tx.monsterSpell.createMany({
                    data: data.spells.map(s => ({
                        monsterId: id.id,
                        spellId: s.spellId,
                        spellType: s.spellType,
                        quantity: s.quantity,
                        usesPerDayId: s.usesPerDayId,
                        saveDC: s.saveDC,
                        level: s.level,
                        specialAbilityId: s.specialAbilityId,
                        notes: s.notes,
                    })),
                });
            }

            if (data.preparedSpellSlots) {
                await tx.monsterPreparedSpellSlots.createMany({
                    data: data.preparedSpellSlots.map(ps => ({
                        monsterId: id.id,
                        spellLevel: ps.spellLevel,
                        numSlots: ps.numSlots,
                    })),
                });
            }

            if (data.extraHitDice) {
                await tx.monsterExtraHitDie.createMany({
                    data: data.extraHitDice.map(ehd => ({
                        monsterId: id.id,
                        hitDiceQty: ehd.hitDiceQty,
                        hitDiceType: ehd.hitDiceType,
                        bonusHP: ehd.bonusHP,
                    })),
                });
            }

            if (data.alternateSpeeds) {
                await tx.monsterAlternateSpeed.createMany({
                    data: data.alternateSpeeds.map(as => ({
                        monsterId: id.id,
                        movementTypeId: as.movementTypeId,
                        speed: as.speed,
                        maneuverability: as.maneuverability,
                    })),
                });
            }

            if (data.domains) {
                await tx.monsterDomainMap.createMany({
                    data: data.domains.map(d => ({
                        monsterId: id.id,
                        domainId: d.domainId,
                    })),
                });
            }

            if (data.extraDescriptions) {
                await tx.monsterExtraDescription.createMany({
                    data: data.extraDescriptions.map(ed => ({
                        monsterId: id.id,
                        type: ed.type,
                        description: ed.description,
                    })),
                });
            }

            if (data.sourceBookInfo) {
                await tx.monsterSourceMap.createMany({
                    data: data.sourceBookInfo.map(sb => ({
                        monsterId: id.id,
                        sourceBookId: sb.sourceBookId,
                        pageNumber: sb.pageNumber,
                    })),
                });
            }
        });

        return { message: 'Monster updated successfully' };
    },

    async deleteMonster(id: MonsterIdParamRequest): Promise<UpdateResponse> {
        await prisma.monster.delete({
            where: { id: id.id },
        });
        return { message: 'Monster deleted successfully' };
    },

    async getMonsterCache(): Promise<MonsterCacheResponse> {
        const monsters = await prisma.monster.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                editionId: true,
                isVisible: true,
            },
        });

        return {
            total: monsters.length,
            results: monsters,
        };
    },
};

