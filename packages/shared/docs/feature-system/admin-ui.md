# Feature System Admin UI

*Documentation for planned admin UI for orphaned feature management.*

## Overview

Orphaned features are features that have no links to classes, races, feats, domains, or companions. These features may be intentionally orphaned (standalone features) or temporarily unlinked during editing. An admin UI is needed to review and manage these features.

## TODO: Admin UI Implementation

### Purpose

Create an admin UI that allows administrators to:
1. View all orphaned features (features with no class/race/feat/domain/companion links)
2. Review feature details before deletion
3. Select specific features for deletion
4. Delete selected orphaned features

### Rationale

**Why Manual Review is Important**:
- Prevents accidental deletion of features that might be intentionally orphaned
- Allows review of features that are temporarily unlinked during editing
- Provides visibility into what will be deleted before deletion occurs
- Gives administrators control over feature cleanup

**Why Not Automatic Cleanup**:
- Automatic cleanup can delete features that are temporarily unlinked during editing
- Some features may be intentionally orphaned (standalone features)
- Manual review ensures data integrity and prevents accidental data loss

### Implementation Requirements

**Backend Support**:
- The `cleanupOrphanedFeatures` method in `FeatureSystemService` already exists and can be used
- Method signature: `cleanupOrphanedFeatures(orphanedFeatureIds: number[]): Promise<void>`
- Method location: `apps/backend/src/features/featureSystem/featureSystemService.ts`

**Frontend Requirements**:
1. **List Orphaned Features**: Query endpoint to list all orphaned features
2. **Feature Details View**: Display feature details (name, description, entities, etc.)
3. **Selection Interface**: Allow admin to select features for deletion
4. **Delete Action**: Call `cleanupOrphanedFeatures` with selected feature IDs

**Workflow**:
1. Admin navigates to orphaned features page
2. System queries for orphaned features (features with no links)
3. Admin reviews feature list
4. Admin selects features to delete
5. Admin confirms deletion
6. System calls `cleanupOrphanedFeatures` with selected IDs
7. System displays success/error message

### Related Code

**Backend Method**:
- `apps/backend/src/features/featureSystem/featureSystemService.ts` - `cleanupOrphanedFeatures` method (line ~1025)

**Note**: This method should NOT be called automatically by class/race services. It should only be called from an admin UI after manual review and selection.
