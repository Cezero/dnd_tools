import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@shared/prisma-client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

describe('Weapon Seeding Script', () => {
    beforeAll(async () => {
        // Skip database operations for now since test database doesn't exist
        // await prisma.weapon.deleteMany();
        // await prisma.item.deleteMany({
        //   where: {
        //     type: 'WEAPON'
        //   }
        // });
    });

    afterAll(async () => {
        // await prisma.$disconnect();
    });

    it('should read weapons.json file', () => {
        const weaponsPath = path.join(__dirname, '../../scripts/weapons.json');
        expect(fs.existsSync(weaponsPath)).toBe(true);

        const weaponsData = JSON.parse(fs.readFileSync(weaponsPath, 'utf8'));
        expect(Array.isArray(weaponsData)).toBe(true);
        expect(weaponsData.length).toBeGreaterThan(0);
    });

    it('should have valid weapon data structure', () => {
        const weaponsPath = path.join(__dirname, '../../scripts/weapons.json');
        const weaponsData = JSON.parse(fs.readFileSync(weaponsPath, 'utf8'));

        // Check first weapon has required structure
        const firstWeapon = weaponsData[0];
        expect(firstWeapon).toHaveProperty('item');
        expect(firstWeapon).toHaveProperty('weapon');

        expect(firstWeapon.item).toHaveProperty('name');
        expect(firstWeapon.item).toHaveProperty('type');
        expect(firstWeapon.item.type).toBe('WEAPON');

        expect(firstWeapon.weapon).toHaveProperty('category');
        expect(firstWeapon.weapon).toHaveProperty('type');
        expect(firstWeapon.weapon).toHaveProperty('damageSmall');
        expect(firstWeapon.weapon).toHaveProperty('damageMedium');
        expect(firstWeapon.weapon).toHaveProperty('critical');
        expect(firstWeapon.weapon).toHaveProperty('damageType');
    });

    it('should have valid weapon data for database insertion', () => {
        const weaponsPath = path.join(__dirname, '../../scripts/weapons.json');
        const weaponsData = JSON.parse(fs.readFileSync(weaponsPath, 'utf8'));

        // Take first weapon for testing
        const testWeapon = weaponsData[0];

        // Validate the data structure matches what the database expects
        expect(testWeapon.item.name).toBeTruthy();
        expect(testWeapon.item.type).toBe('WEAPON');
        expect(typeof testWeapon.weapon.category).toBe('number');
        expect(typeof testWeapon.weapon.type).toBe('number');
        expect(testWeapon.weapon.damageSmall).toBeTruthy();
        expect(testWeapon.weapon.damageMedium).toBeTruthy();
        expect(testWeapon.weapon.critical).toBeTruthy();
        expect(testWeapon.weapon.damageType).toBeTruthy();

        // Validate category and type are within expected ranges
        expect(testWeapon.weapon.category).toBeGreaterThanOrEqual(1);
        expect(testWeapon.weapon.category).toBeLessThanOrEqual(3);
        expect(testWeapon.weapon.type).toBeGreaterThanOrEqual(1);
        expect(testWeapon.weapon.type).toBeLessThanOrEqual(5);
    });

    it('should validate weapon categories and types', () => {
        const weaponsPath = path.join(__dirname, '../../scripts/weapons.json');
        const weaponsData = JSON.parse(fs.readFileSync(weaponsPath, 'utf8'));

        // Check that all weapons have valid categories and types
        weaponsData.forEach((weapon: any, index: number) => {
            expect(weapon.weapon.category, `Weapon ${index} (${weapon.item.name}) has invalid category`).toBeGreaterThanOrEqual(1);
            expect(weapon.weapon.category, `Weapon ${index} (${weapon.item.name}) has invalid category`).toBeLessThanOrEqual(3);
            expect(weapon.weapon.type, `Weapon ${index} (${weapon.item.name}) has invalid type`).toBeGreaterThanOrEqual(1);
            expect(weapon.weapon.type, `Weapon ${index} (${weapon.item.name}) has invalid type`).toBeLessThanOrEqual(5);
        });
    });
}); 