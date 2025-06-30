import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: [],
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