# Cursor Rules Reorganization Summary

## Overview

The cursor rules across the D&D Tools monorepo have been completely reorganized to eliminate duplicates, improve clarity, and establish a clear hierarchy. This document summarizes the changes made and the new structure.

## Problems Identified

### Before Reorganization
1. **Duplicate Rules**: Multiple copies of the same rules existed across different workspaces
2. **Inconsistent Structure**: Different naming conventions and organization patterns
3. **Conflicting Master Rules**: Both `master-rules.mdc` and `00-master-rules.mdc` existed with similar content
4. **Scattered Schema Rules**: Schema-related rules were spread across multiple locations
5. **Inconsistent File Extensions**: Mix of `.mdc` and `.md` files
6. **Multiple Rule Indexes**: Different rule indexes with conflicting information
7. **Workspace-Specific Rules**: Individual workspaces had their own rules instead of centralized approach

### File Count Before
- `/packages/shared/.cursor/rules/` (14 files + 3 subdirectories)
- `/packages/shared/schema/.cursor/rules/` (3 files)
- `/apps/backend/.cursor/rules/` (19 files + 2 subdirectories)
- `/apps/frontend/.cursor/rules/` (16 files)
- `/shared/docs/project-mgmt/.cursor/rules/` (1 file)

## Reorganization Strategy

### 1. Centralized Shared Rules
- **Primary Location**: `packages/shared/.cursor/rules/`
- **Purpose**: All shared rules that apply across workspaces
- **Structure**: Priority-based organization (0 → 1 → 2 → 3)

### 2. Context-Specific Rules
- **Schema Package**: `packages/shared/schema/.cursor/rules/`
- **Backend Package**: `apps/backend/.cursor/rules/`
- **Frontend Package**: `apps/frontend/.cursor/rules/`
- **Documentation**: `shared/docs/project-mgmt/.cursor/rules/`

### 3. Priority-Based Organization
- **Priority 0**: Master Rules (always apply first)
- **Priority 1**: Workflow Rules (critical workflows)
- **Priority 2**: Architecture Rules (structural patterns)
- **Priority 3**: Implementation Rules (specific technologies)

## New Structure

### Shared Rules (`packages/shared/.cursor/rules/`)

#### Master Rules (Priority 0)
- **MASTER-RULES.mdc** - Consolidated master rules (replaces all duplicate master rule files)
- **RULE-INDEX.mdc** - Comprehensive rule discovery guide
- **README.md** - Documentation of the rule structure

#### Workflow Rules (Priority 1)
- **01-workflow-rules/automatic-rule-discovery.mdc** - Multi-workspace rule discovery
- **01-workflow-rules/documentation-enforcement.mdc** - Mandatory documentation updates
- **01-workflow-rules/project-management-workflow.mdc** - Documentation maintenance workflow
- **01-workflow-rules/schema-change-workflow.mdc** - Schema change process
- **01-workflow-rules/workspace-context-detection.mdc** - Workspace verification and safety

#### Architecture Rules (Priority 2)
- **02-architecture-rules/colocate-tests.mdc** - Test file organization
- **02-architecture-rules/documentation-maintenance.mdc** - Documentation accuracy requirements
- **02-architecture-rules/feature-index-exports.mdc** - Feature folder exports
- **02-architecture-rules/file-name-standards.mdc** - File naming conventions
- **02-architecture-rules/monorepo-workspace-awareness.mdc** - Workspace verification and safety
- **02-architecture-rules/schema-dependency-order.mdc** - Schema change order

#### Implementation Rules (Priority 3)
- **03-implementation-rules/error-middleware.mdc** - Error handling patterns
- **03-implementation-rules/global-utilities.mdc** - Utility organization
- **03-implementation-rules/import-order.mdc** - Import organization conventions
- **03-implementation-rules/prisma-types.mdc** - Database type usage patterns
- **03-implementation-rules/use-typescript-types.mdc** - TypeScript type usage
- **03-implementation-rules/validate-request-data.mdc** - Request validation patterns
- **03-implementation-rules/variable-names.mdc** - Variable naming conventions
- **03-implementation-rules/zod-schema.mdc** - Schema definition location

### Context-Specific Rules

#### Schema Package (`packages/shared/schema/.cursor/rules/`)
- **do-not-build-schema.mdc** - Never build schema package
- **schema-validation-patterns.mdc** - Schema design patterns
- **schema-workflow.mdc** - Schema change workflow with enforcement

#### Backend Package (`apps/backend/.cursor/rules/`)
- **async-error-handling.mdc** - Async route handler patterns
- **env-config.mdc** - Configuration and environment variables
- **feature-folders-include-specific-files.mdc** - Organizing a feature folder
- **prisma-client.mdc** - Accessing the database
- **router-entry-point.mdc** - Registering routes
- **separate-service-layer.mdc** - Writing business logic
- **use-middleware.mdc** - Adding reusable logic to routes
- **use-router.mdc** - Organizing routes
- **zod-validation.mdc** - Request and Response validation
- **01-workflow-rules/prisma-migration-workflow.mdc** - Prisma migration workflow
- **01-workflow-rules/rule-discovery.mdc** - Backend-specific rule discovery

#### Frontend Package (`apps/frontend/.cursor/rules/`)
- **accessibility.mdc** - Writing JSX elements
- **component-patterns.mdc** - Constructing React components
- **data-fetching.mdc** - Fetching remote data in a React component
- **event-handlers.mdc** - Defining event handlers in a component
- **feature-folders-include-specific-files.mdc** - Organizing a feature folder
- **form-handling.mdc** - Creating a form with user inputs
- **icons-and-svgs.mdc** - Adding icons or SVGs
- **import-rule.mdc** - When organizing imports
- **react-structure.mdc** - React component structure
- **reusable-components.mdc** - Repeating UI patterns or elements
- **separate-validation-schema.mdc** - Validating request data
- **server-management.mdc** - Server management patterns
- **state-management.mdc** - Managing shared state across components
- **tailwind-structure.mdc** - Applying Tailwind classes in JSX
- **type-definitions.mdc** - Declaring component props or shared types
- **vite-dev-tools.mdc** - Setting up development server or build tooling

#### Documentation (`shared/docs/project-mgmt/.cursor/rules/`)
- **documentation-workflow.mdc** - Project management documentation workflow

## Files Removed

### Duplicate Master Rules
- `packages/shared/.cursor/rules/master-rules.mdc`
- `apps/backend/.cursor/rules/00-master-rules.mdc`

### Duplicate Rule Indexes
- `packages/shared/.cursor/rules/rule-index.mdc`
- `apps/backend/.cursor/rules/rule-index.mdc`

### Duplicate Schema Workflows
- `packages/shared/.cursor/rules/schema-change-workflow.mdc`
- `packages/shared/.cursor/rules/prisma-schema-migration-workflow.mdc`
- `packages/shared/.cursor/rules/zod-schema-build-workflow.mdc`
- `packages/shared/.cursor/rules/schema-file-detection.mdc`

### Duplicate Workflow Rules (Backend)
- `apps/backend/.cursor/rules/01-workflow-rules/automatic-rule-discovery.mdc`
- `apps/backend/.cursor/rules/01-workflow-rules/documentation-enforcement.mdc`
- `apps/backend/.cursor/rules/01-workflow-rules/project-management-workflow.mdc`
- `apps/backend/.cursor/rules/01-workflow-rules/schema-change-workflow.mdc`
- `apps/backend/.cursor/rules/01-workflow-rules/workspace-context-detection.mdc`
- `apps/backend/.cursor/rules/01-workflow-rules/zod-schema-build-workflow.mdc`

### Duplicate Architecture Rules (Backend)
- `apps/backend/.cursor/rules/02-architecture-rules/documentation-maintenance.mdc`

### Duplicate Implementation Rules (Backend)
- `apps/backend/.cursor/rules/03-implementation-rules/error-middleware.mdc`
- `apps/backend/.cursor/rules/03-implementation-rules/global-utilities.mdc`
- `apps/backend/.cursor/rules/03-implementation-rules/prisma-types.mdc`
- `apps/backend/.cursor/rules/03-implementation-rules/use-typescript-types.mdc`
- `apps/backend/.cursor/rules/03-implementation-rules/validate-request-data.mdc`
- `apps/backend/.cursor/rules/03-implementation-rules/variable-names.mdc`
- `apps/backend/.cursor/rules/03-implementation-rules/zod-schema.mdc`

### Outdated Files
- `packages/shared/.cursor/rules/comprehensive-analysis.mdc`
- `packages/shared/.cursor/rules/do-not-run-servers.mdc`
- `packages/shared/.cursor/rules/no-package-installs.mdc`
- `apps/backend/.cursor/rules/prisma-workflow.mdc`
- `apps/backend/.cursor/rules/do-not-run-migrations.mdc`
- `apps/backend/.cursor/rules/README.md`
- `apps/backend/.cursor/rules/RULE-STRUCTURE.md`

## Benefits of Reorganization

### 1. Single Source of Truth
- All shared rules are now in one location
- No more duplicate files causing confusion
- Clear hierarchy and organization

### 2. Improved Discoverability
- Comprehensive rule index for easy navigation
- Clear priority-based organization
- Context-specific rules remain where they belong

### 3. Easier Maintenance
- Only one place to update shared rules
- Consistent naming conventions
- Clear separation of concerns

### 4. Better AI Agent Experience
- Clear rule discovery process
- No conflicting information
- Systematic application order

## Usage Guidelines

### For AI Agents
1. Start with `MASTER-RULES.mdc` for core requirements
2. Use `RULE-INDEX.mdc` for comprehensive rule discovery
3. Apply rules in priority order (0 → 1 → 2 → 3)
4. Check context-specific rules for specialized guidance

### For Developers
1. Follow the rule discovery process
2. Update documentation as you work
3. Never skip schema workflows
4. Verify compliance before committing changes

## Critical Enforcement Points

### Documentation Updates (MANDATORY)
- **NEVER** skip documentation updates
- **ALWAYS** check project-mgmt docs before making changes
- **ALWAYS** update docs during and after implementation

### Schema Changes (CRITICAL)
- **NEVER** skip schema workflows
- **ALWAYS** wait for user confirmation
- **ALWAYS** follow proper order

### Rule Compliance
- **NEVER** proceed without checking relevant rules
- **ALWAYS** verify compliance before making changes
- **ALWAYS** apply rules systematically

## Success Criteria

- All rules are discovered and applied before making changes
- Documentation is kept current and accurate
- Schema changes follow proper workflows
- Code follows established patterns and conventions
- No rules are violated during implementation

## Future Maintenance

### Adding New Rules
1. Determine if rule is shared or context-specific
2. Place in appropriate location based on scope
3. Update `RULE-INDEX.mdc` with new rule
4. Follow naming conventions (`.mdc` extension)

### Updating Existing Rules
1. Update rule in its primary location
2. Ensure no duplicates exist
3. Update `RULE-INDEX.mdc` if needed
4. Test rule discovery process

### Removing Rules
1. Remove rule from its location
2. Update `RULE-INDEX.mdc`
3. Remove any references in other files
4. Clean up empty directories

**CRITICAL**: These rules are non-negotiable. Documentation updates are as important as code changes.
