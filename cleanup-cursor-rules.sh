#!/bin/bash

# Cursor Rules Cleanup Script
# This script removes duplicate and outdated cursor rules files

echo "Starting cursor rules cleanup..."

# Remove duplicate master rules files
echo "Removing duplicate master rules files..."
rm -f /home/countzero/git/dnd_tools/packages/shared/.cursor/rules/master-rules.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/00-master-rules.mdc

# Remove duplicate rule index files
echo "Removing duplicate rule index files..."
rm -f /home/countzero/git/dnd_tools/packages/shared/.cursor/rules/rule-index.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/rule-index.mdc

# Remove duplicate schema workflow files
echo "Removing duplicate schema workflow files..."
rm -f /home/countzero/git/dnd_tools/packages/shared/.cursor/rules/schema-change-workflow.mdc
rm -f /home/countzero/git/dnd_tools/packages/shared/.cursor/rules/prisma-schema-migration-workflow.mdc
rm -f /home/countzero/git/dnd_tools/packages/shared/.cursor/rules/zod-schema-build-workflow.mdc
rm -f /home/countzero/git/dnd_tools/packages/shared/.cursor/rules/schema-file-detection.mdc

# Remove duplicate workflow files from backend
echo "Removing duplicate workflow files from backend..."
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/01-workflow-rules/automatic-rule-discovery.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/01-workflow-rules/documentation-enforcement.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/01-workflow-rules/project-management-workflow.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/01-workflow-rules/schema-change-workflow.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/01-workflow-rules/workspace-context-detection.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/01-workflow-rules/zod-schema-build-workflow.mdc

# Remove duplicate architecture files from backend
echo "Removing duplicate architecture files from backend..."
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/02-architecture-rules/documentation-maintenance.mdc

# Remove duplicate implementation files from backend
echo "Removing duplicate implementation files from backend..."
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/03-implementation-rules/error-middleware.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/03-implementation-rules/global-utilities.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/03-implementation-rules/prisma-types.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/03-implementation-rules/use-typescript-types.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/03-implementation-rules/validate-request-data.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/03-implementation-rules/variable-names.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/03-implementation-rules/zod-schema.mdc

# Remove outdated files
echo "Removing outdated files..."
rm -f /home/countzero/git/dnd_tools/packages/shared/.cursor/rules/comprehensive-analysis.mdc
rm -f /home/countzero/git/dnd_tools/packages/shared/.cursor/rules/do-not-run-servers.mdc
rm -f /home/countzero/git/dnd_tools/packages/shared/.cursor/rules/no-package-installs.mdc

# Remove backend-specific files that should be in shared
echo "Removing backend-specific files that should be in shared..."
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/prisma-workflow.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/do-not-run-migrations.mdc
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/prisma-workflow.mdc

# Remove README and RULE-STRUCTURE files (replaced by new index)
echo "Removing old documentation files..."
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/README.md
rm -f /home/countzero/git/dnd_tools/apps/backend/.cursor/rules/RULE-STRUCTURE.md

# Remove empty directories
echo "Removing empty directories..."
find /home/countzero/git/dnd_tools -type d -empty -path "*/.cursor/rules/*" -delete

echo "Cleanup completed!"
echo ""
echo "New rule structure:"
echo "- MASTER-RULES.mdc (consolidated master rules)"
echo "- RULE-INDEX.mdc (comprehensive rule index)"
echo "- 01-workflow-rules/ (workflow rules)"
echo "- 02-architecture-rules/ (architecture rules)"
echo "- 03-implementation-rules/ (implementation rules)"
echo ""
echo "Context-specific rules remain in their respective packages:"
echo "- packages/shared/schema/.cursor/rules/"
echo "- apps/backend/.cursor/rules/"
echo "- apps/frontend/.cursor/rules/"
echo "- shared/docs/project-mgmt/.cursor/rules/"
