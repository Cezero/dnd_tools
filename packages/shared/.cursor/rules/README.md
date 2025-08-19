# Cursor Rules - D&D Tools Monorepo

This directory contains the centralized cursor rules for the D&D Tools monorepo project. These rules ensure consistent development practices, proper documentation maintenance, and correct schema handling across all workspaces.

## Rule Organization

### Priority-Based Structure
Rules are organized by priority to ensure proper application order:

- **Priority 0**: Master Rules (always apply first)
- **Priority 1**: Workflow Rules (critical workflows)
- **Priority 2**: Architecture Rules (structural patterns)
- **Priority 3**: Implementation Rules (specific technologies)

### Core Files

#### Master Rules (Priority 0)
- **[MASTER-RULES.mdc](MASTER-RULES.mdc)** - Core rules that must be applied before any other rules
- **[RULE-INDEX.mdc](RULE-INDEX.mdc)** - Comprehensive index of all rules for discovery

#### Workflow Rules (Priority 1)
- **[01-workflow-rules/automatic-rule-discovery.mdc](01-workflow-rules/automatic-rule-discovery.mdc)** - Rule discovery coordinator
- **[01-workflow-rules/workspace-context.mdc](01-workflow-rules/workspace-context.mdc)** - Workspace identification and characteristics
- **[01-workflow-rules/rule-discovery.mdc](01-workflow-rules/rule-discovery.mdc)** - Systematic rule discovery process
- **[01-workflow-rules/path-resolution.mdc](01-workflow-rules/path-resolution.mdc)** - Path resolution strategies
- **[01-workflow-rules/safety-checks.mdc](01-workflow-rules/safety-checks.mdc)** - Safety checks and verification
- **[01-workflow-rules/documentation-enforcement.mdc](01-workflow-rules/documentation-enforcement.mdc)** - **MANDATORY** documentation enforcement and project management

#### Architecture Rules (Priority 2)
- **[02-architecture-rules/feature-folders.mdc](02-architecture-rules/feature-folders.mdc)** - Feature folder organization
- **[02-architecture-rules/feature-index-exports.mdc](02-architecture-rules/feature-index-exports.mdc)** - Feature folder exports
- **[02-architecture-rules/file-name-standards.mdc](02-architecture-rules/file-name-standards.mdc)** - File naming conventions

#### Implementation Rules (Priority 3)
- **[03-implementation-rules/error-middleware.mdc](03-implementation-rules/error-middleware.mdc)** - Error handling patterns
- **[03-implementation-rules/global-utilities.mdc](03-implementation-rules/global-utilities.mdc)** - Utility function organization
- **[03-implementation-rules/import-order.mdc](03-implementation-rules/import-order.mdc)** - Import organization conventions
- **[03-implementation-rules/prisma-types.mdc](03-implementation-rules/prisma-types.mdc)** - Prisma type usage
- **[03-implementation-rules/use-typescript-types.mdc](03-implementation-rules/use-typescript-types.mdc)** - TypeScript type definitions
- **[03-implementation-rules/validate-request-data.mdc](03-implementation-rules/validate-request-data.mdc)** - Request validation
- **[03-implementation-rules/variable-names.mdc](03-implementation-rules/variable-names.mdc)** - Variable naming conventions
- **[03-implementation-rules/zod-schema.mdc](03-implementation-rules/zod-schema.mdc)** - Zod schema patterns

## Context-Specific Rules

While the core rules are centralized here, context-specific rules remain in their respective packages:

### Schema Package
- **Location**: `packages/shared/schema/.cursor/rules/`
- **Purpose**: Schema-specific workflows and validation patterns
- **Key File**: `schema-workflow.mdc` - Comprehensive schema change workflow and validation patterns

### Backend Package
- **Location**: `apps/backend/.cursor/rules/`
- **Purpose**: Backend-specific patterns (routes, services, middleware)

### Frontend Package
- **Location**: `apps/frontend/.cursor/rules/`
- **Purpose**: Frontend-specific patterns (components, hooks, styling)
- **Key Files**: 
  - `base-ui-patterns.mdc` - Base UI library integration and patterns
  - `component-patterns.mdc` - React component structure
  - `tailwind-structure.mdc` - Tailwind CSS styling patterns

### Documentation
- **Location**: `shared/docs/project-mgmt/.cursor/rules/`
- **Purpose**: Documentation workflow and maintenance

## Critical Enforcement Points

### Documentation Updates (MANDATORY)
**NEVER** skip documentation updates. The following actions MUST trigger documentation updates:
- Creating new files
- Modifying existing files
- Deleting files
- Changing file structure
- Adding new features
- Fixing bugs
- Refactoring code
- Updating schemas
- Changing dependencies

### Required Documentation Actions
1. **Before making changes**: Check `shared/docs/project-mgmt/README.md`
2. **During implementation**: Update status as you work
3. **After completion**: Update all affected documents
4. **When discovering gaps**: Add to appropriate documents

### Schema Changes (CRITICAL)
**NEVER** skip schema workflows:
1. **Prisma Schema Changes**: Update, then STOP for migration
2. **Zod Schema Changes**: Update, then STOP for build
3. **Wait for user confirmation** before proceeding
4. **Never run migrations or builds automatically**
5. **Follow dependency order**: Database Schema → API Schema → Backend Services → Frontend Components
6. **Follow validation patterns** for consistent and type-safe schemas

### Frontend UI Development (CRITICAL)
**ALWAYS** use Base UI components for consistent interfaces:
1. **Prefer Base UI** over custom implementations for standard UI patterns
2. **Use Tailwind CSS** for styling Base UI components
3. **Maintain accessibility** - Base UI handles ARIA attributes automatically
4. **Follow composition patterns** for customizing component behavior
5. **Use design system colors** and spacing consistently

### Rule Compliance
**NEVER** proceed without checking relevant rules:
1. **Apply Priority 0 rules** (master rules) first
2. **Apply Priority 1 rules** (workflow rules) second
3. **Apply Priority 2 rules** (architecture rules) third
4. **Apply Priority 3 rules** (implementation rules) fourth
5. **Verify compliance** with complete rule set before proceeding

## Rule Discovery Process

### Step 1: Check Master Rules
Always start with `MASTER-RULES.mdc` to understand core requirements.

### Step 2: Identify File Type
Determine the type of file you're working with:
- Schema files (Prisma/Zod)
- Backend files
- Frontend files
- Documentation files

### Step 3: Apply Relevant Rules
Based on file type and operation:
1. Apply Priority 0 rules (master rules)
2. Apply Priority 1 rules (workflow rules)
3. Apply Priority 2 rules (architecture rules)
4. Apply Priority 3 rules (implementation rules)

### Step 4: Verify Compliance
Ensure all relevant rules are being followed before proceeding.

## Success Criteria

- All rules are discovered and applied before making changes
- Documentation is kept current and accurate
- Schema changes follow proper workflows
- Code follows established patterns and conventions
- No rules are violated during implementation

## Recent Optimization

### What Changed
- **Split large files** into focused, manageable components
- **Consolidated redundant rules** into single comprehensive files
- **Eliminated duplicate functionality** across workspaces
- **Improved metadata** for better rule discovery
- **Optimized context efficiency** with smaller, focused files
- **Removed test-related rules** (not applicable to this project)
- **Added Base UI integration rules** for consistent frontend development

### File Size Optimizations
- **automatic-rule-discovery.mdc**: 258 lines → 50 lines (coordinator)
- **documentation-enforcement.mdc**: 166 lines → 120 lines (consolidated)
- **schema-workflow.mdc**: 105 lines → 150 lines (comprehensive)
- **Created focused files**: workspace-context.mdc, rule-discovery.mdc, path-resolution.mdc, safety-checks.mdc
- **Added base-ui-patterns.mdc**: 300+ lines (comprehensive UI patterns)

### Redundancy Eliminations
- **Removed 8 redundant files** (333+ lines of duplicate content)
- **Consolidated feature folder rules** into shared location
- **Merged schema validation patterns** into workflow
- **Unified documentation enforcement** and project management
- **Removed test-related rules** (colocate-tests.mdc)
- **Added comprehensive Base UI patterns** for frontend development

### Benefits
- **Reduced context consumption** by ~40%
- **Faster rule discovery** with focused files
- **Easier maintenance** with consolidated rules
- **Better rule compliance** with digestible information
- **Clearer organization** with logical structure
- **Removed irrelevant rules** for project-specific needs
- **Enhanced frontend development** with Base UI integration

## Usage

### For AI Agents
1. Start with `MASTER-RULES.mdc` for core requirements
2. Use `RULE-INDEX.mdc` for comprehensive rule discovery
3. Apply rules in priority order (0 → 1 → 2 → 3)
4. Check context-specific rules for specialized guidance

### For Developers
1. Follow the rule discovery process
2. Update documentation as you work
3. Never skip schema workflows
4. Use Base UI components for consistent interfaces
5. Verify compliance before committing changes

**CRITICAL**: These rules are non-negotiable. Documentation updates are as important as code changes.
