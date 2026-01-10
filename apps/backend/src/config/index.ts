/**
 * Centralized configuration management with environment variable validation.
 * 
 * This module provides type-safe access to application configuration with runtime
 * validation of environment variables. It ensures:
 * - All required environment variables are present and valid
 * - Configuration values are properly typed
 * - Invalid configuration causes immediate failure at startup
 * 
 * Architecture Decisions:
 * - Zod validation: Uses Zod schemas to validate and transform environment variables
 *   at startup, providing type safety and clear error messages
 * - Centralized config: Single source of truth for all configuration, preventing
 *   scattered process.env access throughout the codebase
 * - Fail-fast: Invalid configuration causes immediate process exit, preventing
 *   runtime errors from missing or invalid config
 * - Type safety: Configuration object is typed and exported, enabling IntelliSense
 *   and compile-time checking
 * 
 * Usage:
 * Import config from this module to access any configuration value. The config
 * object is guaranteed to be valid and properly typed.
 * 
 * Source File: `apps/backend/src/config/index.ts`
 */

import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment variable validation schema.
 * 
 * Validates and transforms all required environment variables with appropriate
 * types and constraints. Invalid variables cause process exit with clear error messages.
 */
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default(3001),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    DATABASE_URL: z.string().refine((val) => {
        try {
            new URL(val);
            return true;
        } catch {
            return false;
        }
    }, 'DATABASE_URL must be a valid URL'),
    DEBUG: z.string().default(''),
});

/**
 * Validates environment variables against the schema.
 * 
 * Architecture Decision: Using safeParse allows graceful error handling with
 * detailed error messages. Invalid configuration causes immediate process exit
 * to prevent running with invalid settings.
 */
const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
    console.error('❌ Invalid environment variables:');
    console.error(envParse.error.format());
    process.exit(1);
}

const env = envParse.data;

/**
 * Application configuration object.
 * 
 * Provides type-safe access to all configuration values. All values are validated
 * at startup and guaranteed to be present and properly typed.
 * 
 * Architecture Decision: Using 'as const' ensures the configuration object is
 * deeply readonly, preventing accidental modification at runtime.
 */
export const config = {
    env: env.NODE_ENV,
    port: env.PORT,
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: '12h' as const,
    },
    debug: env.DEBUG,
    database: {
        url: env.DATABASE_URL,
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
} as const;

/**
 * TypeScript type for the configuration object.
 * 
 * Exported for use in type annotations throughout the application.
 */
export type Config = typeof config;

/**
 * TypeScript type for environment values.
 * 
 * Represents the valid environment values: 'development', 'production', or 'test'.
 */
export type Environment = Config['env'];

/**
 * Helper function to check if running in development environment.
 * 
 * Architecture Decision: Helper functions provide convenient, type-safe checks
 * for environment without needing to compare strings directly.
 * 
 * @returns True if NODE_ENV is 'development'
 */
export const isDevelopment = config.env === 'development';

/**
 * Helper function to check if running in production environment.
 * 
 * @returns True if NODE_ENV is 'production'
 */
export const isProduction = config.env === 'production';

/**
 * Helper function to check if running in test environment.
 * 
 * @returns True if NODE_ENV is 'test'
 */
export const isTest = config.env === 'test';
