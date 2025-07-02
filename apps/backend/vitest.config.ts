import path from 'path';
import { defineConfig } from 'vitest/config';


export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
    },
    resolve: {
        alias: {
            '@shared/prisma-client': path.resolve(__dirname, '../packages/shared/prisma-client'),
            '@shared/schema': path.resolve(__dirname, '../packages/shared/schema'),
        },
    },
}); 