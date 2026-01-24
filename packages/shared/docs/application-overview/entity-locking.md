# Entity Locking

*Draft locking using Redis to prevent concurrent editing conflicts.*

## Overview

The draft system uses Redis-backed locks to ensure that only one user can edit a specific draft at a time.
Locks are keyed by `DraftType` and draft `id` and are enforced by backend draft controllers before any write
to draft state.

## Redis keys

- **Lock key**: `lock:{draftType}:{id}` → `userId`
- **Lock metadata key**: `lockMeta:{draftType}:{id}` → `{ "lockedAt": "<ISO timestamp>" }`

The metadata key is used by admin monitoring to show when the lock was acquired.

## TTL behavior

Locks are stored with a TTL (time-to-live). Acquiring an existing lock held by the same user refreshes the TTL
while preserving the original `lockedAt` timestamp.

## Implementation

**Backend service**:

- `apps/backend/src/features/shared/draftState/DraftLockService.ts`
  - `acquireLock(draftType, id, userId, ttl?)`
  - `checkLock(draftType, id)`
  - `releaseLock(draftType, id, userId)`
  - `forceReleaseLock(draftType, id, requestingUserId)` (admin-only)

## Related documentation

- [Entity State Management](./entity-state-management.md)
- [Admin Session Monitoring](./admin-session-monitoring.md)

