# @shared/docs

Comprehensive documentation for the D&D Tools feature system, database schema, and interaction patterns.

## Overview

This documentation package provides detailed guidance for developers working with the D&D Tools application, covering the feature system, database interactions, and best practices for both frontend and backend development.

### **🎯 Start Here**
- **[System Overview](system-overview.md)** - Complete overview of all systems and their relationships
- **[Comprehensive Documentation Overview](comprehensive-documentation-overview.md)** - Detailed documentation structure and status

## Documentation Structure

### 📋 Features Documentation (`features/`)
- **overview.md** - Complete guide to the feature system architecture
- **modeling-scenarios.md** - How to model various D&D scenarios using the feature system
- **examples/** - Practical examples and use cases

### 🗄️ Database Documentation (`database/`)
- **schema-overview.md** - High-level database schema explanation
- **tables/** - Detailed documentation for each table
- **relationships.md** - How tables relate and interact with each other

### 🎨 Frontend Components (`frontend-components/`)
- **generic-list-system.md** - Reusable list component with filtering and selection
- **validated-form-system.md** - Type-safe form system with Zod validation
- **api-integration-patterns.md** - Frontend API integration patterns and best practices

### ⚙️ Backend Patterns (`backend/`)
- **backend-patterns.md** - Backend service layer, controllers, and middleware patterns

### 🔌 API Design (`api/`)
- **api-design-standards.md** - API design guidelines, RESTful conventions, and standards

## Quick Start

1. **New to the project?** Start with `features/overview.md`
2. **Working with the database?** Check `database/schema-overview.md`
3. **Building frontend components?** Review `frontend-components/` patterns
4. **Working on backend services?** Check `backend/backend-patterns.md`
5. **Designing APIs?** Follow `api/api-design-standards.md`

## Contributing to Documentation

When adding or modifying features:
1. Update relevant documentation in this package
2. Add examples to demonstrate usage
3. Keep documentation in sync with code changes

## Usage in Development

This documentation is designed to be referenced by both developers and AI assistants when building features. The structured approach ensures comprehensive coverage of the system's capabilities.

### For Developers
- Reference these docs when implementing new features
- Use examples as templates for common scenarios
- Follow the patterns outlined in component and service guides

### For AI Assistants
- These docs provide context for code generation
- Examples demonstrate proper usage patterns
- Guidelines ensure consistent implementation across frontend and backend

## Maintenance

Documentation should be updated whenever:
- New features are added to the system
- Database schema changes are made
- New component or service patterns are established
- API changes or new endpoints are added
- Breaking changes are introduced

---

*This documentation package is part of the D&D Tools monorepo and follows the shared package conventions.*
