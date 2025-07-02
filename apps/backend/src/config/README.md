# Configuration Setup

This directory contains the centralized configuration management for the backend application.

## Environment Variables

The following environment variables are required:

### Required Variables

- `NODE_ENV`: Environment mode (`development`, `production`, `test`)
- `PORT`: Server port number (1-65535)
- `JWT_SECRET`: Secret key for JWT token signing
- `DATABASE_URL`: PostgreSQL database connection URL

### Optional Variables

- `CORS_ORIGIN`: CORS origin URL (defaults to `http://localhost:3000`)

## Example .env file

```env
# Environment Configuration
NODE_ENV=development
PORT=3001

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/dnd_tools

# CORS Configuration (optional)
CORS_ORIGIN=http://localhost:3000
```

## Usage

Import the configuration in your files:

```typescript
import { config } from '../config';

// Access configuration values
const port = config.port;
const jwtSecret = config.jwt.secret;
const isDev = config.env === 'development';
```

## Validation

Environment variables are validated at startup using Zod schemas. If any required variables are missing or invalid, the application will exit with an error message. 