import { PrismaClient } from '@shared/prisma-client/client';

const prisma = new PrismaClient();

async function migrateDiceConfigs() {
    console.log('Starting dice configuration migration...');

    try {
        // 1. Ensure there's a default admin dice configuration
        let defaultConfig = await prisma.diceBoxAdminConfig.findFirst({
            where: { isDefault: true }
        });

        if (!defaultConfig) {
            console.log('Creating default admin dice configuration...');
            defaultConfig = await prisma.diceBoxAdminConfig.create({
                data: {
                    name: 'Default Configuration',
                    isDefault: true,
                    gravity: 1,
                    mass: 1,
                    friction: 0.8,
                    restitution: 0,
                    angularDamping: 0.4,
                    linearDamping: 0.4,
                    spinForce: 4,
                    throwForce: 5,
                    startingHeight: 8,
                    settleTimeout: 5000,
                    lightIntensity: 1,
                    enableShadows: true,
                    shadowTransparency: 0.8,
                    theme: 'rock', // 3D dice theme
                    themeColor: '#3937b8',
                    scale: 3
                }
            });
            console.log(`Created default dice configuration with ID: ${defaultConfig.id}`);
        } else {
            console.log(`Found existing default dice configuration with ID: ${defaultConfig.id}`);
        }

        // 2. Migrate existing user dice preferences
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { diceTheme: { not: null } },
                    { diceThemeColor: { not: null } },
                    { diceScale: { not: null } }
                ]
            }
        });

        console.log(`Found ${users.length} users with existing dice preferences to migrate`);

        for (const user of users) {
            console.log(`Migrating user ${user.username} (ID: ${user.id})...`);

            // Set base dice configuration to default
            await prisma.user.update({
                where: { id: user.id },
                data: { diceConfigBase: defaultConfig.id }
            });

            // Create overrides for existing preferences
            const overrides = [];
            if (user.diceTheme) {
                overrides.push({
                    userId: user.id,
                    propertyName: 'theme', // 3D dice theme
                    propertyValue: user.diceTheme
                });
                console.log(`  - Added 3D dice theme override: ${user.diceTheme}`);
            }
            if (user.diceThemeColor) {
                overrides.push({
                    userId: user.id,
                    propertyName: 'themeColor',
                    propertyValue: user.diceThemeColor
                });
                console.log(`  - Added theme color override: ${user.diceThemeColor}`);
            }
            if (user.diceScale) {
                overrides.push({
                    userId: user.id,
                    propertyName: 'scale',
                    propertyValue: user.diceScale.toString()
                });
                console.log(`  - Added scale override: ${user.diceScale}`);
            }

            if (overrides.length > 0) {
                await prisma.userDiceConfigOverride.createMany({
                    data: overrides
                });
                console.log(`  - Created ${overrides.length} overrides`);
            }
        }

        console.log(`\nMigration completed successfully!`);
        console.log(`- Migrated ${users.length} users`);
        console.log(`- Default dice configuration ID: ${defaultConfig.id}`);

        // 3. Verify migration
        const migratedUsers = await prisma.user.findMany({
            where: { diceConfigBase: { not: null } },
            include: {
                diceConfigOverrides: true
            }
        });

        console.log(`\nVerification:`);
        console.log(`- Users with base dice configuration: ${migratedUsers.length}`);

        const totalOverrides = migratedUsers.reduce((sum, user) => sum + user.diceConfigOverrides.length, 0);
        console.log(`- Total overrides created: ${totalOverrides}`);

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateDiceConfigs()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}

export { migrateDiceConfigs }; 
