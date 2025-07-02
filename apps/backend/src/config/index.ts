import 'dotenv/config';
import { z } from 'zod';

// Environment variable validation schema
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3001'),
    JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
    DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
});

// Validate environment variables
const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
    console.error('❌ Invalid environment variables:');
    console.error(envParse.error.format());
    process.exit(1);
}

const env = envParse.data;

// Configuration object
export const config = {
    env: env.NODE_ENV,
    port: env.PORT,
    jwt: {
        secret: env.JWT_SECRET,
        expiresIn: '12h' as const,
    },
    database: {
        url: env.DATABASE_URL,
    },
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true,
    },
} as const;

// Type exports
export type Config = typeof config;
export type Environment = Config['env'];

// Helper function to check if in development
export const isDevelopment = config.env === 'development';
export const isProduction = config.env === 'production';
export const isTest = config.env === 'test';
