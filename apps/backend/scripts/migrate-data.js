#!/usr/bin/env node
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

import { PrismaClient } from '@shared/prisma-client';


dotenv.config();

const prisma = new PrismaClient();

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cyberdnd_old',
    port: process.env.DB_PORT || 3306
};

async function connectToOldDatabase() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to old database');
        return connection;
    } catch (error) {
        console.error('Error connecting to old database:', error);
        throw error;
    }
}

// Transform functions for each table
async function migrateSourceBooks(connection) {
    console.log('Migrating source books...');
    const [rows] = await connection.execute(`
        SELECT id, name, abbr as abbreviation, release_date as releaseDate, 
               edition_id as editionId, \`desc\` as description, display as isVisible
        FROM source_books
    `);

    for (const row of rows) {
        await prisma.sourceBook.upsert({
            where: { id: row.id },
            update: {
                name: row.name,
                abbreviation: row.abbreviation,
                releaseDate: row.releaseDate ? new Date(row.releaseDate) : null,
                editionId: row.editionId,
                description: row.description,
                isVisible: Boolean(row.isVisible)
            },
            create: {
                id: row.id,
                name: row.name,
                abbreviation: row.abbreviation,
                releaseDate: row.releaseDate ? new Date(row.releaseDate) : null,
                editionId: row.editionId,
                description: row.description,
                isVisible: Boolean(row.isVisible)
            }
        });
    }
    console.log(`Migrated ${rows.length} source books`);
}

async function migrateClasses(connection) {
    console.log('Migrating classes...');
    const [rows] = await connection.execute(`
        SELECT id, name, abbr as abbreviation, edition_id as editionId, 
               is_prestige as isPrestige, display as isVisible, can_cast as canCastSpells,
               hit_die as hitDie, \`desc\` as description, skill_points as skillPoints,
               cast_ability as castingAbilityId
        FROM classes
    `);

    for (const row of rows) {
        await prisma.class.upsert({
            where: { id: row.id },
            update: {
                name: row.name,
                abbreviation: row.abbreviation,
                editionId: row.editionId,
                isPrestige: Boolean(row.isPrestige),
                isVisible: Boolean(row.isVisible),
                canCastSpells: Boolean(row.canCastSpells),
                hitDie: row.hitDie,
                description: row.description,
                skillPoints: row.skillPoints,
                castingAbilityId: row.castingAbilityId
            },
            create: {
                id: row.id,
                name: row.name,
                abbreviation: row.abbreviation,
                editionId: row.editionId,
                isPrestige: Boolean(row.isPrestige),
                isVisible: Boolean(row.isVisible),
                canCastSpells: Boolean(row.canCastSpells),
                hitDie: row.hitDie,
                description: row.description,
                skillPoints: row.skillPoints,
                castingAbilityId: row.castingAbilityId
            }
        });
    }
    console.log(`Migrated ${rows.length} classes`);
}

async function migrateClassFeatures(connection) {
    console.log('Migrating class features...');
    const [rows] = await connection.execute(`
        SELECT id, class_id as classId, name, \`desc\` as description, level
        FROM class_features
    `);

    for (const row of rows) {
        await prisma.classFeature.upsert({
            where: { id: row.id },
            update: {
                classId: row.classId,
                name: row.name,
                description: row.description,
                level: row.level
            },
            create: {
                id: row.id,
                classId: row.classId,
                name: row.name,
                description: row.description,
                level: row.level
            }
        });
    }
    console.log(`Migrated ${rows.length} class features`);
}

async function migrateClassLevelAttributes(connection) {
    console.log('Migrating class level attributes...');
    const [rows] = await connection.execute(`
        SELECT id as classId, level, base_attack_bonus as baseAttackBonus, 
               fort_save as fortSave, ref_save as refSave, will_save as willSave
        FROM class_level_attributes
    `);

    for (const row of rows) {
        await prisma.classLevelAttribute.upsert({
            where: {
                classId_level: {
                    classId: row.classId,
                    level: row.level
                }
            },
            update: {
                classId: row.classId,
                level: row.level,
                baseAttackBonus: row.baseAttackBonus,
                fortSave: row.fortSave,
                refSave: row.refSave,
                willSave: row.willSave
            },
            create: {
                classId: row.classId,
                level: row.level,
                baseAttackBonus: row.baseAttackBonus,
                fortSave: row.fortSave,
                refSave: row.refSave,
                willSave: row.willSave
            }
        });
    }
    console.log(`Migrated ${rows.length} class level attributes`);
}

async function migrateSkills(connection) {
    console.log('Migrating skills...');
    const [rows] = await connection.execute(`
        SELECT id, name, ability_id as abilityId, check_desc as checkDescription,
               action_desc as actionDescription, retry_id as retryTypeId,
               retry_desc as retryDescription, special_desc as specialNotes,
               synergy_desc as synergyNotes, untrained_desc as untrainedNotes,
               ac_penalty_applies as affectedByArmor, \`desc\` as description,
               trained_only as trainedOnly
        FROM skills
    `);

    for (const row of rows) {
        await prisma.skill.upsert({
            where: { id: row.id },
            update: {
                name: row.name,
                abilityId: row.abilityId,
                checkDescription: row.checkDescription,
                actionDescription: row.actionDescription,
                retryTypeId: row.retryTypeId,
                retryDescription: row.retryDescription,
                specialNotes: row.specialNotes,
                synergyNotes: row.synergyNotes,
                untrainedNotes: row.untrainedNotes,
                affectedByArmor: Boolean(row.affectedByArmor),
                description: row.description,
                trainedOnly: row.trainedOnly ? Boolean(row.trainedOnly) : null
            },
            create: {
                id: row.id,
                name: row.name,
                abilityId: row.abilityId,
                checkDescription: row.checkDescription,
                actionDescription: row.actionDescription,
                retryTypeId: row.retryTypeId,
                retryDescription: row.retryDescription,
                specialNotes: row.specialNotes,
                synergyNotes: row.synergyNotes,
                untrainedNotes: row.untrainedNotes,
                affectedByArmor: Boolean(row.affectedByArmor),
                description: row.description,
                trainedOnly: row.trainedOnly ? Boolean(row.trainedOnly) : null
            }
        });
    }
    console.log(`Migrated ${rows.length} skills`);
}

async function migrateClassSkillMap(connection) {
    console.log('Migrating class skill mappings...');
    const [rows] = await connection.execute(`
        SELECT id as classId, skill_id as skillId
        FROM class_skill_map
    `);

    for (const row of rows) {
        await prisma.classSkillMap.upsert({
            where: {
                classId_skillId: {
                    classId: row.classId,
                    skillId: row.skillId
                }
            },
            update: {
                classId: row.classId,
                skillId: row.skillId
            },
            create: {
                classId: row.classId,
                skillId: row.skillId
            }
        });
    }
    console.log(`Migrated ${rows.length} class skill mappings`);
}

async function migrateClassSourceMap(connection) {
    console.log('Migrating class source mappings...');
    const [rows] = await connection.execute(`
        SELECT id as classId, book_id as sourceBookId, page_number as pageNumber
        FROM class_source_map
    `);

    for (const row of rows) {
        await prisma.classSourceMap.upsert({
            where: {
                classId_sourceBookId: {
                    classId: row.classId,
                    sourceBookId: row.sourceBookId
                }
            },
            update: {
                classId: row.classId,
                sourceBookId: row.sourceBookId,
                pageNumber: row.pageNumber
            },
            create: {
                classId: row.classId,
                sourceBookId: row.sourceBookId,
                pageNumber: row.pageNumber
            }
        });
    }
    console.log(`Migrated ${rows.length} class source mappings`);
}

async function migrateSpells(connection) {
    console.log('Migrating spells...');
    const [rows] = await connection.execute(`
        SELECT id, name, summary, \`desc\` as description, cast_time as castingTime,
               range_str as \`range\`, range_id as rangeTypeId, range_value as rangeValue,
               area_desc as area, duration_desc as duration, save_desc as savingThrow,
               sr_desc as spellResistance, edition_id as editionId, base_level as baseLevel,
               effect_desc as effect, target_desc as target
        FROM spells
    `);

    for (const row of rows) {
        await prisma.spell.upsert({
            where: { id: row.id },
            update: {
                name: row.name,
                summary: row.summary,
                description: row.description,
                castingTime: row.castingTime,
                range: row.range,
                rangeTypeId: row.rangeTypeId,
                rangeValue: row.rangeValue,
                area: row.area,
                duration: row.duration,
                savingThrow: row.savingThrow,
                spellResistance: row.spellResistance,
                editionId: row.editionId,
                baseLevel: row.baseLevel,
                effect: row.effect,
                target: row.target
            },
            create: {
                id: row.id,
                name: row.name,
                summary: row.summary,
                description: row.description,
                castingTime: row.castingTime,
                range: row.range,
                rangeTypeId: row.rangeTypeId,
                rangeValue: row.rangeValue,
                area: row.area,
                duration: row.duration,
                savingThrow: row.savingThrow,
                spellResistance: row.spellResistance,
                editionId: row.editionId,
                baseLevel: row.baseLevel,
                effect: row.effect,
                target: row.target
            }
        });
    }
    console.log(`Migrated ${rows.length} spells`);
}

async function migrateSpellLevelMap(connection) {
    console.log('Migrating spell level mappings...');
    const [rows] = await connection.execute(`
        SELECT id as spellId, class_id as classId, level, display as isVisible
        FROM spell_level_map
    `);

    for (const row of rows) {
        await prisma.spellLevelMap.upsert({
            where: {
                spellId_classId: {
                    spellId: row.spellId,
                    classId: row.classId
                }
            },
            update: {
                spellId: row.spellId,
                classId: row.classId,
                level: row.level,
                isVisible: Boolean(row.isVisible)
            },
            create: {
                spellId: row.spellId,
                classId: row.classId,
                level: row.level,
                isVisible: Boolean(row.isVisible)
            }
        });
    }
    console.log(`Migrated ${rows.length} spell level mappings`);
}

async function migrateSpellDescriptorMap(connection) {
    console.log('Migrating spell descriptor mappings...');
    const [rows] = await connection.execute(`
        SELECT id as spellId, desc_id as descriptorId
        FROM spell_descriptor_map
    `);

    for (const row of rows) {
        await prisma.spellDescriptorMap.upsert({
            where: {
                spellId_descriptorId: {
                    spellId: row.spellId,
                    descriptorId: row.descriptorId
                }
            },
            update: {
                spellId: row.spellId,
                descriptorId: row.descriptorId
            },
            create: {
                spellId: row.spellId,
                descriptorId: row.descriptorId
            }
        });
    }
    console.log(`Migrated ${rows.length} spell descriptor mappings`);
}

async function migrateSpellSchoolMap(connection) {
    console.log('Migrating spell school mappings...');
    const [rows] = await connection.execute(`
        SELECT id as spellId, school_id as schoolId
        FROM spell_school_map
    `);

    for (const row of rows) {
        await prisma.spellSchoolMap.upsert({
            where: {
                spellId_schoolId: {
                    spellId: row.spellId,
                    schoolId: row.schoolId
                }
            },
            update: {
                spellId: row.spellId,
                schoolId: row.schoolId
            },
            create: {
                spellId: row.spellId,
                schoolId: row.schoolId
            }
        });
    }
    console.log(`Migrated ${rows.length} spell school mappings`);
}

async function migrateSpellSourceMap(connection) {
    console.log('Migrating spell source mappings...');
    const [rows] = await connection.execute(`
        SELECT id as spellId, book_id as sourceBookId, page_number as pageNumber
        FROM spell_source_map
    `);

    for (const row of rows) {
        await prisma.spellSourceMap.upsert({
            where: {
                spellId_sourceBookId: {
                    spellId: row.spellId,
                    sourceBookId: row.sourceBookId
                }
            },
            update: {
                spellId: row.spellId,
                sourceBookId: row.sourceBookId,
                pageNumber: row.pageNumber
            },
            create: {
                spellId: row.spellId,
                sourceBookId: row.sourceBookId,
                pageNumber: row.pageNumber
            }
        });
    }
    console.log(`Migrated ${rows.length} spell source mappings`);
}

async function migrateSpellSubschoolMap(connection) {
    console.log('Migrating spell subschool mappings...');
    const [rows] = await connection.execute(`
        SELECT id as spellId, sub_id as subSchoolId
        FROM spell_subschool_map
    `);

    for (const row of rows) {
        await prisma.spellSubschoolMap.upsert({
            where: {
                spellId_subSchoolId: {
                    spellId: row.spellId,
                    subSchoolId: row.subSchoolId
                }
            },
            update: {
                spellId: row.spellId,
                subSchoolId: row.subSchoolId
            },
            create: {
                spellId: row.spellId,
                subSchoolId: row.subSchoolId
            }
        });
    }
    console.log(`Migrated ${rows.length} spell subschool mappings`);
}

async function migrateSpellComponentMap(connection) {
    console.log('Migrating spell component mappings...');
    const [rows] = await connection.execute(`
        SELECT id as spellId, comp_id as componentId
        FROM spell_component_map
    `);

    for (const row of rows) {
        await prisma.spellComponentMap.upsert({
            where: {
                spellId_componentId: {
                    spellId: row.spellId,
                    componentId: row.componentId
                }
            },
            update: {
                spellId: row.spellId,
                componentId: row.componentId
            },
            create: {
                spellId: row.spellId,
                componentId: row.componentId
            }
        });
    }
    console.log(`Migrated ${rows.length} spell component mappings`);
}

async function migrateFeats(connection) {
    console.log('Migrating feats...');
    const [rows] = await connection.execute(`
        SELECT id, name, type as typeId, \`desc\` as description, benefit_desc as benefit,
               normal_desc as normalEffect, special_desc as specialEffect,
               prereq_desc as prerequisites, can_take_repeat as repeatable,
               is_fighter_bonus as fighterBonus
        FROM feats
    `);

    for (const row of rows) {
        await prisma.feat.upsert({
            where: { id: row.id },
            update: {
                name: row.name,
                typeId: row.typeId,
                description: row.description,
                benefit: row.benefit,
                normalEffect: row.normalEffect,
                specialEffect: row.specialEffect,
                prerequisites: row.prerequisites,
                repeatable: row.repeatable ? Boolean(row.repeatable) : null,
                fighterBonus: row.fighterBonus ? Boolean(row.fighterBonus) : null
            },
            create: {
                id: row.id,
                name: row.name,
                typeId: row.typeId,
                description: row.description,
                benefit: row.benefit,
                normalEffect: row.normalEffect,
                specialEffect: row.specialEffect,
                prerequisites: row.prerequisites,
                repeatable: row.repeatable ? Boolean(row.repeatable) : null,
                fighterBonus: row.fighterBonus ? Boolean(row.fighterBonus) : null
            }
        });
    }
    console.log(`Migrated ${rows.length} feats`);
}

async function migrateFeatBenefitMap(connection) {
    console.log('Migrating feat benefit mappings...');
    const [rows] = await connection.execute(`
        SELECT feat_id as featId, type as typeId, reference_id as referenceId,
               amount, \`index\`
        FROM feat_benefit_map
    `);

    for (const row of rows) {
        await prisma.featBenefitMap.upsert({
            where: { featId_index: { featId: row.featId, index: row.index } },
            update: {
                featId: row.featId,
                typeId: row.typeId,
                referenceId: row.referenceId,
                amount: row.amount
            },
            create: {
                featId: row.featId,
                typeId: row.typeId,
                referenceId: row.referenceId,
                amount: row.amount,
                index: row.index
            }
        });
    }
    console.log(`Migrated ${rows.length} feat benefit mappings`);
}

async function migrateFeatPrerequisiteMap(connection) {
    console.log('Migrating feat prerequisite mappings...');
    const [rows] = await connection.execute(`
        SELECT feat_id as featId, type as typeId, reference_id as referenceId,
               amount, \`index\`
        FROM feat_prereq_map
    `);

    for (const row of rows) {
        await prisma.featPrerequisiteMap.upsert({
            where: { featId_index: { featId: row.featId, index: row.index } },
            update: {
                featId: row.featId,
                typeId: row.typeId,
                referenceId: row.referenceId,
                amount: row.amount
            },
            create: {
                featId: row.featId,
                typeId: row.typeId,
                referenceId: row.referenceId,
                amount: row.amount,
                index: row.index
            }
        });
    }
    console.log(`Migrated ${rows.length} feat prerequisite mappings`);
}

async function migrateRaces(connection) {
    console.log('Migrating races...');
    const [rows] = await connection.execute(`
        SELECT id, name, edition_id as editionId, display as isVisible,
               \`desc\` as description, size_id as sizeId, speed, favored_class_id as favoredClassId
        FROM races
    `);

    for (const row of rows) {
        await prisma.race.upsert({
            where: { id: row.id },
            update: {
                name: row.name,
                editionId: row.editionId,
                isVisible: Boolean(row.isVisible),
                description: row.description,
                sizeId: row.sizeId,
                speed: row.speed,
                favoredClassId: row.favoredClassId
            },
            create: {
                id: row.id,
                name: row.name,
                editionId: row.editionId,
                isVisible: Boolean(row.isVisible),
                description: row.description,
                sizeId: row.sizeId,
                speed: row.speed,
                favoredClassId: row.favoredClassId
            }
        });
    }
    console.log(`Migrated ${rows.length} races`);
}

async function migrateRaceTraits(connection) {
    console.log('Migrating race traits...');
    const [rows] = await connection.execute(`
        SELECT slug, name, \`desc\` as description, has_value as hasValue
        FROM race_traits
    `);

    for (const row of rows) {
        await prisma.raceTrait.upsert({
            where: { slug: row.slug },
            update: {
                name: row.name,
                description: row.description,
                hasValue: Boolean(row.hasValue)
            },
            create: {
                slug: row.slug,
                name: row.name,
                description: row.description,
                hasValue: Boolean(row.hasValue)
            }
        });
    }
    console.log(`Migrated ${rows.length} race traits`);
}

async function migrateRaceTraitMap(connection) {
    console.log('Migrating race trait mappings...');
    const [rows] = await connection.execute(`
        SELECT id as raceId, slug as traitSlug, value
        FROM race_trait_map
    `);

    for (const row of rows) {
        await prisma.raceTraitMap.upsert({
            where: {
                raceId_traitSlug: {
                    raceId: row.raceId,
                    traitSlug: row.traitSlug
                }
            },
            update: {
                raceId: row.raceId,
                traitSlug: row.traitSlug,
                value: row.value ? parseInt(row.value) : null
            },
            create: {
                raceId: row.raceId,
                traitSlug: row.traitSlug,
                value: row.value ? parseInt(row.value) : null
            }
        });
    }
    console.log(`Migrated ${rows.length} race trait mappings`);
}

async function migrateRaceAbilityAdjustments(connection) {
    console.log('Migrating race ability adjustments...');
    const [rows] = await connection.execute(`
        SELECT id as raceId, ability_id as abilityId, adjustment as value
        FROM race_ability_adjustments
    `);

    for (const row of rows) {
        await prisma.raceAbilityAdjustment.upsert({
            where: {
                raceId_abilityId: {
                    raceId: row.raceId,
                    abilityId: row.abilityId
                }
            },
            update: {
                raceId: row.raceId,
                abilityId: row.abilityId,
                value: row.value
            },
            create: {
                raceId: row.raceId,
                abilityId: row.abilityId,
                value: row.value
            }
        });
    }
    console.log(`Migrated ${rows.length} race ability adjustments`);
}

async function migrateRaceLanguageMap(connection) {
    console.log('Migrating race language mappings...');
    const [rows] = await connection.execute(`
        SELECT id as raceId, language_id as languageId, is_automatic as isAutomatic
        FROM race_language_map
    `);

    for (const row of rows) {
        await prisma.raceLanguageMap.upsert({
            where: {
                raceId_languageId: {
                    raceId: row.raceId,
                    languageId: row.languageId
                }
            },
            update: {
                raceId: row.raceId,
                languageId: row.languageId,
                isAutomatic: Boolean(row.isAutomatic)
            },
            create: {
                raceId: row.raceId,
                languageId: row.languageId,
                isAutomatic: Boolean(row.isAutomatic)
            }
        });
    }
    console.log(`Migrated ${rows.length} race language mappings`);
}

async function migrateRaceSourceMap(connection) {
    console.log('Migrating race source mappings...');
    const [rows] = await connection.execute(`
        SELECT id as raceId, book_id as sourceBookId, page_number as pageNumber
        FROM race_source_map
    `);

    for (const row of rows) {
        await prisma.raceSourceMap.upsert({
            where: {
                raceId_sourceBookId: {
                    raceId: row.raceId,
                    sourceBookId: row.sourceBookId
                }
            },
            update: {
                raceId: row.raceId,
                sourceBookId: row.sourceBookId,
                pageNumber: row.pageNumber
            },
            create: {
                raceId: row.raceId,
                sourceBookId: row.sourceBookId,
                pageNumber: row.pageNumber
            }
        });
    }
    console.log(`Migrated ${rows.length} race source mappings`);
}

async function migrateArmor(connection) {
    console.log('Migrating armor...');
    const [rows] = await connection.execute(`
        SELECT armor_id as id, armor_name as name, armor_description as description,
               armor_category as category, armor_cost as cost, armor_bonus as bonus,
               armor_dex_cap as dexterityCap, armor_check_penalty as checkPenalty,
               armor_arcane_spell_failure as arcaneSpellFailure,
               armor_speed_cap_thirty as speedCapThirty,
               armor_speed_cap_twenty as speedCapTwenty, armor_weight as weight
        FROM armor
    `);

    for (const row of rows) {
        await prisma.armor.upsert({
            where: { id: row.id },
            update: {
                name: row.name,
                description: row.description,
                category: row.category,
                cost: row.cost,
                bonus: row.bonus,
                dexterityCap: row.dexterityCap,
                checkPenalty: row.checkPenalty,
                arcaneSpellFailure: row.arcaneSpellFailure,
                speedCapThirty: row.speedCapThirty,
                speedCapTwenty: row.speedCapTwenty,
                weight: row.weight
            },
            create: {
                id: row.id,
                name: row.name,
                description: row.description,
                category: row.category,
                cost: row.cost,
                bonus: row.bonus,
                dexterityCap: row.dexterityCap,
                checkPenalty: row.checkPenalty,
                arcaneSpellFailure: row.arcaneSpellFailure,
                speedCapThirty: row.speedCapThirty,
                speedCapTwenty: row.speedCapTwenty,
                weight: row.weight
            }
        });
    }
    console.log(`Migrated ${rows.length} armor items`);
}

async function migrateWeapons(connection) {
    console.log('Migrating weapons...');
    const [rows] = await connection.execute(`
        SELECT id, name, \`desc\` as description, category, cost_gp as cost,
               dmg_s as damageSmall, dmg_m as damageMedium, crit_str as critical,
               range_str as \`range\`, weight, damage_type_id as damageTypeId
        FROM weapons
    `);

    for (const row of rows) {
        await prisma.weapon.upsert({
            where: { id: row.id },
            update: {
                name: row.name,
                description: row.description,
                category: row.category,
                cost: row.cost,
                damageSmall: row.damageSmall,
                damageMedium: row.damageMedium,
                critical: row.critical,
                range: row.range,
                weight: row.weight,
                damageTypeId: row.damageTypeId
            },
            create: {
                id: row.id,
                name: row.name,
                description: row.description,
                category: row.category,
                cost: row.cost,
                damageSmall: row.damageSmall,
                damageMedium: row.damageMedium,
                critical: row.critical,
                range: row.range,
                weight: row.weight,
                damageTypeId: row.damageTypeId
            }
        });
    }
    console.log(`Migrated ${rows.length} weapons`);
}

async function migrateReferenceTables(connection) {
    console.log('Migrating reference tables...');
    const [rows] = await connection.execute(`
        SELECT slug, name, description
        FROM reference_tables
    `);

    for (const row of rows) {
        await prisma.referenceTable.upsert({
            where: { slug: row.slug },
            update: {
                name: row.name,
                description: row.description
            },
            create: {
                slug: row.slug,
                name: row.name,
                description: row.description
            }
        });
    }
    console.log(`Migrated ${rows.length} reference tables`);
}

async function migrateReferenceTableColumns(connection) {
    console.log('Migrating reference table columns...');
    const [rows] = await connection.execute(`
        SELECT rt.slug as tableSlug, rtc.column_index as \`index\`, rtc.header, rtc.span, rtc.alignment
        FROM reference_table_columns rtc
        JOIN reference_tables rt ON rtc.table_id = rt.id
        `);

    for (const row of rows) {
        await prisma.referenceTableColumn.upsert({
            where: {
                tableSlug_index: {
                    tableSlug: row.tableSlug,
                    index: row.index
                }
            },
            update: {
                tableSlug: row.tableSlug,
                index: row.index,
                header: row.header,
                span: row.span,
                alignment: row.alignment
            },
            create: {
                tableSlug: row.tableSlug,
                index: row.index,
                header: row.header,
                span: row.span,
                alignment: row.alignment
            }
        });
    }
    console.log(`Migrated ${rows.length} reference table columns`);
}

async function migrateReferenceTableRows(connection) {
    console.log('Migrating reference table rows...');
    const [rows] = await connection.execute(`
        SELECT rt.slug as tableSlug, rtr.row_index as \`index\`
        FROM reference_table_rows rtr
        JOIN reference_tables rt ON rtr.table_id = rt.id
    `);

    for (const row of rows) {
        await prisma.referenceTableRow.upsert({
            where: {
                tableSlug_index: {
                    tableSlug: row.tableSlug,
                    index: row.index
                }
            },
            update: {
                tableSlug: row.tableSlug,
                index: row.index
            },
            create: {
                tableSlug: row.tableSlug,
                index: row.index
            }
        });
    }
    console.log(`Migrated ${rows.length} reference table rows`);
}

async function migrateReferenceTableCells(connection) {
    console.log('Migrating reference table cells...');
    const [rows] = await connection.execute(`
        SELECT rt.slug as tableSlug, rtcol.column_index as columnIndex, rtr.row_index as rowIndex, 
               rtc.value, rtc.col_span as colSpan, rtc.row_span as rowSpan
        FROM reference_table_cells rtc
        JOIN reference_table_columns rtcol ON rtcol.id = rtc.column_id
        JOIN reference_table_rows rtr ON rtr.id = rtc.row_id
        JOIN reference_tables rt ON rt.id = rtr.table_id
    `);

    for (const row of rows) {
        await prisma.referenceTableCell.upsert({
            where: {
                tableSlug_columnIndex_rowIndex: {
                    tableSlug: row.tableSlug,
                    columnIndex: row.columnIndex,
                    rowIndex: row.rowIndex
                }
            },
            update: {
                tableSlug: row.tableSlug,
                columnIndex: row.columnIndex,
                rowIndex: row.rowIndex,
                value: row.value,
                colSpan: row.colSpan,
                rowSpan: row.rowSpan
            },
            create: {
                tableSlug: row.tableSlug,
                columnIndex: row.columnIndex,
                rowIndex: row.rowIndex,
                value: row.value,
                colSpan: row.colSpan,
                rowSpan: row.rowSpan
            }
        });
    }
    console.log(`Migrated ${rows.length} reference table cells`);
}

async function migrateUsers(connection) {
    console.log('Migrating users...');
    const [rows] = await connection.execute(`
        SELECT id, username, email, password_hash as password, is_admin as isAdmin,
               created_at as createdAt, updated_at as updatedAt,
               preferred_edition_id as preferredEditionId
        FROM users
    `);

    for (const row of rows) {
        await prisma.user.upsert({
            where: { id: row.id },
            update: {
                username: row.username,
                email: row.email,
                password: row.password,
                isAdmin: Boolean(row.isAdmin),
                createdAt: new Date(row.createdAt),
                updatedAt: new Date(row.updatedAt),
                preferredEditionId: row.preferredEditionId
            },
            create: {
                id: row.id,
                username: row.username,
                email: row.email,
                password: row.password,
                isAdmin: Boolean(row.isAdmin),
                createdAt: new Date(row.createdAt),
                updatedAt: new Date(row.updatedAt),
                preferredEditionId: row.preferredEditionId
            }
        });
    }
    console.log(`Migrated ${rows.length} users`);
}

async function migrateUserCharacters(connection) {
    console.log('Migrating user characters...');
    const [rows] = await connection.execute(`
        SELECT id, user_id as userId, name, race_id as raceId,
               alignment_id as alignmentId, age, height, weight, eyes, hair, gender
        FROM user_characters
    `);

    for (const row of rows) {
        await prisma.userCharacter.upsert({
            where: { id: row.id },
            update: {
                userId: row.userId,
                name: row.name,
                raceId: row.raceId,
                alignmentId: row.alignmentId,
                age: row.age,
                height: row.height,
                weight: row.weight,
                eyes: row.eyes,
                hair: row.hair,
                gender: row.gender,
            },
            create: {
                id: row.id,
                userId: row.userId,
                name: row.name,
                raceId: row.raceId,
                alignmentId: row.alignmentId,
                age: row.age,
                height: row.height,
                weight: row.weight,
                eyes: row.eyes,
                hair: row.hair,
                gender: row.gender,
            }
        });
    }
    console.log(`Migrated ${rows.length} user characters`);
}

async function migrateUserCharacterAttributes(connection) {
    console.log('Migrating user character attributes...');
    const [rows] = await connection.execute(`
        SELECT character_id as characterId, attribute_id as attributeId, value
        FROM user_char_attr_map
    `);

    for (const row of rows) {
        await prisma.userCharacterAttribute.create({
            data: {
                characterId: row.characterId,
                attributeId: row.attributeId,
                value: row.value
            }
        });
    }
    console.log(`Migrated ${rows.length} user character attributes`);
}

// Main migration function
async function migrateData() {
    let connection;

    try {
        console.log('Starting data migration...');

        // Connect to old database
        connection = await connectToOldDatabase();

        // Migrate data in order (respecting foreign key constraints)
        await migrateSourceBooks(connection);
        await migrateClasses(connection);
        await migrateClassFeatures(connection);
        await migrateClassLevelAttributes(connection);
        await migrateSkills(connection);
        await migrateClassSkillMap(connection);
        await migrateClassSourceMap(connection);
        await migrateSpells(connection);
        await migrateSpellLevelMap(connection);
        await migrateSpellDescriptorMap(connection);
        await migrateSpellSchoolMap(connection);
        await migrateSpellSourceMap(connection);
        await migrateSpellSubschoolMap(connection); 
        await migrateSpellComponentMap(connection);
        await migrateFeats(connection);
        await migrateFeatBenefitMap(connection);
        await migrateFeatPrerequisiteMap(connection);
        await migrateRaces(connection);
        await migrateRaceTraits(connection);
        await migrateRaceTraitMap(connection);
        await migrateRaceAbilityAdjustments(connection);
        await migrateRaceLanguageMap(connection);
        await migrateRaceSourceMap(connection);
        await migrateArmor(connection);
        await migrateWeapons(connection);
        await migrateReferenceTables(connection);
        await migrateReferenceTableColumns(connection);
        await migrateReferenceTableRows(connection);
        await migrateReferenceTableCells(connection);
//        await migrateUsers(connection);
        await migrateUserCharacters(connection);
        await migrateUserCharacterAttributes(connection);

        console.log('Data migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
        await prisma.$disconnect();
    }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateData()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

export { migrateData }; 