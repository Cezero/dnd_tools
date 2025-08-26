# Cursor Rule System Documentation

Based on comprehensive testing of Cursor's rule system, this document provides practical guidance on how to effectively use `fetch_rules()` and organize rules across the monorepo.

## Overview

Cursor's rule system is more powerful than initially apparent, but requires understanding of its actual capabilities and limitations. This document provides the findings from extensive testing and practical implementation patterns.

## Key Discoveries

### ✅ What Actually Works

1. **Cross-Workspace Rule Loading**: `fetch_rules()` can load rules from any workspace
2. **Logical Workspace Names**: Uses `backend/`, `frontend/`, `shared/` instead of file paths
3. **Additive Loading**: Rules persist throughout the session
4. **Multiple Formats**: Both `workspace/rule-name` and `workspace/category/rule-name` work

### ❌ What Doesn't Work

1. **Automatic Execution**: Instructions in rules are just documentation
2. **Short Names**: Must include workspace prefix
3. **File System Paths**: Uses logical names, not actual file paths
4. **Partial Paths**: Must be complete workspace/category/rule-name

## Working Path Formats

### ✅ Confirmed Working Formats

```typescript
// Shared workspace rules
await fetch_rules(['shared/03-implementation-rules/import-order']);
await fetch_rules(['shared/02-architecture-rules/feature-index-exports']);

// Backend workspace rules
await fetch_rules(['backend/prisma-client']);
await fetch_rules(['backend/async-error-handling']);

// Frontend workspace rules
await fetch_rules(['frontend/base-ui-core']);
await fetch_rules(['frontend/react-structure']);
```

### ❌ Confirmed Non-Working Formats

```typescript
// These will return "No rules found"
await fetch_rules(['import-order']);                    // Missing workspace prefix
await fetch_rules(['03-implementation-rules/import-order']); // Missing shared prefix
await fetch_rules(['shared/import-order']);             // Missing category
await fetch_rules(['apps/backend/.cursor/rules/prisma-client']); // File system path
```

## Practical Usage Patterns

### 1. Context-Based Rule Loading

```typescript
// For React component work
await fetch_rules([
  'frontend/base-ui-core',
  'frontend/react-structure',
  'frontend/type-definitions',
  'shared/03-implementation-rules/import-order'
]);

// For backend API work
await fetch_rules([
  'backend/prisma-client',
  'backend/async-error-handling',
  'backend/zod-validation',
  'shared/03-implementation-rules/import-order'
]);

// For schema work
await fetch_rules([
  'backend/prisma-schema-workflow',
  'shared/03-implementation-rules/zod-schema'
]);
```

### 2. Rule Discovery Strategy

```typescript
// Start with core rules
await fetch_rules(['shared/03-implementation-rules/import-order']);

// Add workspace-specific rules
await fetch_rules(['backend/prisma-client']); // or frontend/base-ui-core

// Add additional context rules as needed
await fetch_rules(['shared/02-architecture-rules/feature-index-exports']);
```

### 3. Error Handling

```typescript
// Always verify rule loading
const result = await fetch_rules(['backend/prisma-client']);
if (result === "No rules found") {
  // Rule doesn't exist or path is incorrect
  console.log("Rule not found, check path format");
}
```

## Key Insights

### 1. **Logical Workspace Names**
The system uses logical workspace names (`backend`, `frontend`, `shared`) rather than file system paths.

### 2. **Additive Loading**
Rules are additive - successfully loaded rules remain available throughout the session.

### 3. **Manual Execution Required**
Instructions in rules are just documentation. You must manually call `fetch_rules()` to load additional rules.

### 4. **Consistent Format**
Always use: `{workspace}/{category}/{rule-name}` or `{workspace}/{rule-name}`

## Best Practices

### 1. **Load Rules Early**
Load context-specific rules at the beginning of your work session.

### 2. **Use Descriptive Names**
The rule names should clearly indicate their purpose and workspace.

### 3. **Group Related Rules**
Load related rules together for better context.

### 4. **Verify Loading**
Always check if rules loaded successfully before proceeding.

### 5. **Document Dependencies**
When creating rules, document which other rules they depend on.

## Example Workflows

### React Component Development
```typescript
// Load React-specific rules
await fetch_rules([
  'frontend/base-ui-core',
  'frontend/react-structure',
  'frontend/type-definitions',
  'shared/03-implementation-rules/import-order'
]);
// Now you have React context for component development
```

### Backend API Development
```typescript
// Load backend-specific rules
await fetch_rules([
  'backend/prisma-client',
  'backend/async-error-handling',
  'backend/zod-validation',
  'shared/03-implementation-rules/import-order'
]);
// Now you have backend context for API development
```

### Schema Development
```typescript
// Load schema-specific rules
await fetch_rules([
  'backend/prisma-schema-workflow',
  'shared/03-implementation-rules/zod-schema'
]);
// Now you have schema context for database/schema work
```

## Advanced Patterns

### 1. **Conditional Rule Loading**

```typescript
// Load rules based on file type
if (filePath.includes('.tsx') || filePath.includes('.jsx')) {
  await fetch_rules(['frontend/react-structure', 'frontend/base-ui-core']);
} else if (filePath.includes('.prisma')) {
  await fetch_rules(['backend/prisma-schema-workflow']);
}
```

### 2. **Rule Sets for Common Tasks**

```typescript
// Common rule sets you can reuse
const REACT_RULES = [
  'frontend/base-ui-core',
  'frontend/react-structure',
  'frontend/type-definitions',
  'shared/03-implementation-rules/import-order'
];

const BACKEND_RULES = [
  'backend/prisma-client',
  'backend/async-error-handling',
  'backend/zod-validation',
  'shared/03-implementation-rules/import-order'
];

// Use them
await fetch_rules(REACT_RULES);
```

### 3. **Progressive Rule Loading**

```typescript
// Start with basic rules
await fetch_rules(['shared/03-implementation-rules/import-order']);

// Add specific rules as needed
if (task.includes('component')) {
  await fetch_rules(['frontend/react-structure']);
}
if (task.includes('database')) {
  await fetch_rules(['backend/prisma-client']);
}
```

## Troubleshooting

### Common Issues

1. **"No rules found"**
   - Check if you're using the correct workspace prefix
   - Verify the rule name matches exactly
   - Ensure you're using the full path format

2. **Rules not loading**
   - Make sure the rule file exists in the correct location
   - Check that the rule has the correct metadata
   - Verify the workspace name is correct

3. **Context not updating**
   - Remember that rules are additive
   - Check if the rule was actually loaded successfully
   - Verify the rule content is what you expect

### Debugging Tips

```typescript
// Test rule loading step by step
console.log("Testing rule loading...");

const result1 = await fetch_rules(['shared/03-implementation-rules/import-order']);
console.log("Import order rule:", result1);

const result2 = await fetch_rules(['backend/prisma-client']);
console.log("Prisma client rule:", result2);
```

## Implementation Strategy

### Phase 1: Update Existing Rules
1. Remove aspirational content that assumes automatic execution
2. Add practical `fetch_rules()` instructions where appropriate
3. Update rule descriptions to reflect actual capabilities

### Phase 2: Create Context-Specific Rule Sets
1. Define common rule sets for different types of work
2. Create documentation for when to use each rule set
3. Establish patterns for rule dependencies

### Phase 3: Optimize Rule Organization
1. Organize rules by workspace and category
2. Ensure consistent naming conventions
3. Create clear documentation for each rule's purpose

## Conclusion

The Cursor rule system is more functional than initially thought, but requires understanding of its actual capabilities. By using `fetch_rules()` with the correct path formats and following the patterns outlined in this document, you can create a dynamic and effective rule system across your monorepo.

The key is to treat rules as **static documentation with dynamic loading capabilities** rather than expecting automatic execution of embedded instructions.
