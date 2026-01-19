"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var prisma_client_1 = require("@shared/prisma-client");
var static_data_1 = require("@shared/static-data");
var prisma = new prisma_client_1.PrismaClient();
/**
 * Migration script to convert existing ProgressionType enum values to formula-based entities
 *
 * This script:
 * 1. Finds all FeatureEntity records with BAB (appliesToId = ProgressionType)
 * 2. Finds all FeatureEntity records with Saving Throws (appliesToSubId = ProgressionType)
 * 3. Creates FeatureFormulaParams records for each
 * 4. Updates entities to reference formula params and set appropriate values
 * 5. Clears appliesToId/appliesToSubId for BAB/saves
 *
 * Usage:
 *   cd apps/backend
 *   npx tsx scripts/migrate-bab-save-to-formulas.ts
 */
function migrateBABAndSavesToFormulas() {
    return __awaiter(this, void 0, void 0, function () {
        var babEntities, babMigrated, _i, babEntities_1, entity, progressionType, formulaParamsData, entityValue, formulaParams, progressionTypeName, saveEntities, savesMigrated, _a, saveEntities_1, entity, progressionType, saveType, formulaParamsData, formulaParams, saveTypeName, progressionTypeName, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('Starting migration of BAB and Saving Throw entities to formula-based approach...\n');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 14, 15, 17]);
                    return [4 /*yield*/, prisma.featureEntity.findMany({
                            where: {
                                appliesTo: static_data_1.EntityAppliesToType.BaseAttackBonus,
                                appliesToId: {
                                    not: null,
                                },
                                // Only migrate entities that don't already have formula params
                                formulaParamsId: null,
                            },
                        })];
                case 2:
                    babEntities = _b.sent();
                    console.log("Found ".concat(babEntities.length, " BAB entities to migrate"));
                    babMigrated = 0;
                    _i = 0, babEntities_1 = babEntities;
                    _b.label = 3;
                case 3:
                    if (!(_i < babEntities_1.length)) return [3 /*break*/, 7];
                    entity = babEntities_1[_i];
                    progressionType = entity.appliesToId;
                    if (progressionType === null || progressionType === undefined) {
                        console.warn("Skipping entity ".concat(entity.id, ": invalid appliesToId"));
                        return [3 /*break*/, 6];
                    }
                    formulaParamsData = void 0;
                    entityValue = null;
                    if (progressionType === static_data_1.ProgressionType.good) {
                        // Good BAB: LINEAR_SCALING with scalingValue=1
                        formulaParamsData = {
                            formulaId: 1 /* FormulaId.LINEAR_SCALING */,
                            interval: null,
                            formulaStartLevel: null,
                            abilityId: null,
                            thresholds: null,
                            values: null,
                            valuesRepresent: null,
                            cumulative: false,
                            includeProgressionLevel: true,
                            divisor: null,
                            baseValue: null,
                        };
                        entityValue = 1;
                    }
                    else if (progressionType === static_data_1.ProgressionType.average) {
                        // Average BAB: LEVEL_TIMES_VALUE with scalingValue=0.75
                        formulaParamsData = {
                            formulaId: 9 /* FormulaId.LEVEL_TIMES_VALUE */,
                            interval: null,
                            formulaStartLevel: null,
                            abilityId: null,
                            thresholds: null,
                            values: null,
                            valuesRepresent: null,
                            cumulative: false,
                            includeProgressionLevel: true,
                            divisor: null,
                            baseValue: null,
                        };
                        entityValue = 0.75;
                    }
                    else if (progressionType === static_data_1.ProgressionType.poor) {
                        // Poor BAB: LEVEL_TIMES_VALUE with scalingValue=0.5
                        formulaParamsData = {
                            formulaId: 9 /* FormulaId.LEVEL_TIMES_VALUE */,
                            interval: null,
                            formulaStartLevel: null,
                            abilityId: null,
                            thresholds: null,
                            values: null,
                            valuesRepresent: null,
                            cumulative: false,
                            includeProgressionLevel: true,
                            divisor: null,
                            baseValue: null,
                        };
                        entityValue = 0.5;
                    }
                    else {
                        console.warn("Skipping entity ".concat(entity.id, ": unknown progression type ").concat(progressionType));
                        return [3 /*break*/, 6];
                    }
                    return [4 /*yield*/, prisma.featureFormulaParams.create({
                            data: formulaParamsData,
                        })];
                case 4:
                    formulaParams = _b.sent();
                    // Update entity to reference formula params and set value
                    return [4 /*yield*/, prisma.featureEntity.update({
                            where: { id: entity.id },
                            data: {
                                formulaParamsId: formulaParams.id,
                                value: entityValue,
                                appliesToId: null, // Clear ProgressionType enum value
                            },
                        })];
                case 5:
                    // Update entity to reference formula params and set value
                    _b.sent();
                    babMigrated++;
                    progressionTypeName = progressionType === static_data_1.ProgressionType.good ? 'good' :
                        progressionType === static_data_1.ProgressionType.average ? 'average' : 'poor';
                    console.log("  Migrated BAB entity ".concat(entity.id, " (progression type: ").concat(progressionTypeName, ")"));
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 3];
                case 7:
                    console.log("\nMigrated ".concat(babMigrated, " BAB entities\n"));
                    return [4 /*yield*/, prisma.featureEntity.findMany({
                            where: {
                                appliesTo: static_data_1.EntityAppliesToType.SavingThrow,
                                appliesToSubId: {
                                    not: null,
                                },
                                // Only migrate entities that don't already have formula params
                                formulaParamsId: null,
                            },
                        })];
                case 8:
                    saveEntities = _b.sent();
                    console.log("Found ".concat(saveEntities.length, " Saving Throw entities to migrate"));
                    savesMigrated = 0;
                    _a = 0, saveEntities_1 = saveEntities;
                    _b.label = 9;
                case 9:
                    if (!(_a < saveEntities_1.length)) return [3 /*break*/, 13];
                    entity = saveEntities_1[_a];
                    progressionType = entity.appliesToSubId;
                    saveType = entity.appliesToId;
                    if (progressionType === null || progressionType === undefined) {
                        console.warn("Skipping entity ".concat(entity.id, ": invalid appliesToSubId"));
                        return [3 /*break*/, 12];
                    }
                    if (saveType === null || saveType === undefined) {
                        console.warn("Skipping entity ".concat(entity.id, ": invalid appliesToId (save type)"));
                        return [3 /*break*/, 12];
                    }
                    formulaParamsData = void 0;
                    if (progressionType === static_data_1.ProgressionType.good) {
                        // Good Save: LEVEL_DIVIDED_BY_PLUS_BASE with divisor=2, baseValue=2
                        formulaParamsData = {
                            formulaId: 15 /* FormulaId.LEVEL_DIVIDED_BY_PLUS_BASE */,
                            divisor: 2,
                            baseValue: 2,
                            interval: null,
                            formulaStartLevel: null,
                            abilityId: null,
                            thresholds: null,
                            values: null,
                            valuesRepresent: null,
                            cumulative: false,
                            includeProgressionLevel: true,
                        };
                    }
                    else if (progressionType === static_data_1.ProgressionType.poor) {
                        // Poor Save: LEVEL_DIVIDED_BY with divisor=3
                        formulaParamsData = {
                            formulaId: 14 /* FormulaId.LEVEL_DIVIDED_BY */,
                            divisor: 3,
                            baseValue: null,
                            interval: null,
                            formulaStartLevel: null,
                            abilityId: null,
                            thresholds: null,
                            values: null,
                            valuesRepresent: null,
                            cumulative: false,
                            includeProgressionLevel: true,
                        };
                    }
                    else {
                        console.warn("Skipping entity ".concat(entity.id, ": unknown progression type ").concat(progressionType));
                        return [3 /*break*/, 12];
                    }
                    return [4 /*yield*/, prisma.featureFormulaParams.create({
                            data: formulaParamsData,
                        })];
                case 10:
                    formulaParams = _b.sent();
                    // Update entity to reference formula params
                    // Note: appliesToId stays (it's the save type), but appliesToSubId is cleared
                    return [4 /*yield*/, prisma.featureEntity.update({
                            where: { id: entity.id },
                            data: {
                                formulaParamsId: formulaParams.id,
                                value: null, // Saves don't use entity.value
                                appliesToSubId: null, // Clear ProgressionType enum value
                            },
                        })];
                case 11:
                    // Update entity to reference formula params
                    // Note: appliesToId stays (it's the save type), but appliesToSubId is cleared
                    _b.sent();
                    savesMigrated++;
                    saveTypeName = saveType === static_data_1.SavingThrowId.Fortitude ? 'Fortitude' :
                        saveType === static_data_1.SavingThrowId.Reflex ? 'Reflex' : 'Will';
                    progressionTypeName = progressionType === static_data_1.ProgressionType.good ? 'good' : 'poor';
                    console.log("  Migrated ".concat(saveTypeName, " Save entity ").concat(entity.id, " (progression type: ").concat(progressionTypeName, ")"));
                    _b.label = 12;
                case 12:
                    _a++;
                    return [3 /*break*/, 9];
                case 13:
                    console.log("\nMigrated ".concat(savesMigrated, " Saving Throw entities\n"));
                    console.log("\nMigration complete!");
                    console.log("  - BAB entities migrated: ".concat(babMigrated));
                    console.log("  - Save entities migrated: ".concat(savesMigrated));
                    console.log("  - Total entities migrated: ".concat(babMigrated + savesMigrated));
                    return [3 /*break*/, 17];
                case 14:
                    error_1 = _b.sent();
                    console.error('Error during migration:', error_1);
                    throw error_1;
                case 15: return [4 /*yield*/, prisma.$disconnect()];
                case 16:
                    _b.sent();
                    return [7 /*endfinally*/];
                case 17: return [2 /*return*/];
            }
        });
    });
}
// Run migration
migrateBABAndSavesToFormulas()
    .then(function () {
    console.log('\nMigration completed successfully!');
    process.exit(0);
})
    .catch(function (error) {
    console.error('\nMigration failed:', error);
    process.exit(1);
});
