# Session and State Management System

## Overview

The session and state management system provides a generic, type-safe architecture for managing editing sessions across multiple entity types (Character, Class, Race). This system eliminates code duplication while maintaining type safety and system-specific functionality.

**Source Files**:
- Backend: `apps/backend/src/features/shared/session/`
- Frontend: `apps/frontend/src/lib/hooks/`

## Architecture

The system follows a layered architecture with clear separation between generic infrastructure and entity-specific implementations:

```mermaid
graph TB
    subgraph Frontend["Frontend Layer"]
        EditComponent[Edit Component<br/>CharacterEdit/ClassEdit/RaceEdit]
        EditStateHook[useGenericEditState<br/>State Management]
        ResolutionHook[useGenericResolution<br/>Session Management]
        SyncUtils[useStateSync<br/>State Synchronization]
    end
    
    subgraph API["API Layer"]
        ResolutionApi[Resolution API<br/>Character/Class/Race]
    end
    
    subgraph Backend["Backend Layer"]
        SessionController[GenericSessionController<br/>Request Handlers]
        SessionService[GenericSessionService<br/>Session Storage]
        UpdateApplier[GenericUpdateApplier<br/>State Updates]
        SaveService[SaveService<br/>MySQL Persistence]
    end
    
    subgraph Database["Database Layer"]
        Redis[(Redis<br/>Session Storage<br/>with TTL)]
        MySQL[(MySQL<br/>Entity Storage)]
    end
    
    EditComponent --> EditStateHook
    EditComponent --> ResolutionHook
    EditComponent --> SyncUtils
    EditStateHook --> ResolutionHook
    SyncUtils --> ResolutionHook
    ResolutionHook --> ResolutionApi
    ResolutionApi --> SessionController
    SessionController --> SessionService
    SessionController --> UpdateApplier
    SessionController --> SaveService
    SessionService --> Redis
    SaveService --> MySQL
    
    style EditComponent fill:#e1f5ff
    style ResolutionHook fill:#fff4e1
    style SessionService fill:#ffe1f5
    style Redis fill:#e1ffe1
    style MySQL fill:#e1ffe1
```

## Core Concepts

### Session Lifecycle

Sessions follow a well-defined lifecycle from creation to completion:

```mermaid
stateDiagram-v2
    [*] --> Initializing: User opens edit page
    Initializing --> CheckingSession: Load entity
    CheckingSession --> ResumingSession: Session exists
    CheckingSession --> CreatingSession: No session
    ResumingSession --> Active: Session loaded
    CreatingSession --> Active: Session created
    Active --> Updating: User makes changes
    Updating --> Active: Update applied
    Active --> Saving: User saves
    Active --> Cancelling: User cancels
    Active --> Expired: Session expires
    Saving --> Saved: Save successful
    Cancelling --> Cancelled: Cancel successful
    Expired --> [*]: Cleanup
    Saved --> [*]: Complete
    Cancelled --> [*]: Complete
    
    note right of Active
        Session state stored in Redis
        Updates applied via UpdateApplier
        State synced to frontend
        Automatic expiration via TTL
    end note
    
    note right of Saving
        Session state transformed
        Saved to MySQL
        Session deleted from Redis
    end note
```

### State Synchronization

The system uses a standardized pattern for synchronizing state changes from frontend to backend:

```mermaid
sequenceDiagram
    participant User
    participant EditComponent
    participant EditStateHook
    participant SyncUtils
    participant ResolutionHook
    participant API
    participant SessionController
    participant SessionService
    participant UpdateApplier
    
    User->>EditComponent: Change field value
    EditComponent->>EditStateHook: updateState({ type: 'SET_NAME', payload: { name: 'New Name' } })
    EditStateHook->>EditStateHook: Update local state
    EditStateHook-->>EditComponent: State updated
    
    EditComponent->>SyncUtils: useFieldSync(state, sessionId, applyUpdate)
    SyncUtils->>SyncUtils: Detect state change
    SyncUtils->>SyncUtils: Build update operation
    SyncUtils->>ResolutionHook: applyUpdate(update)
    
    ResolutionHook->>API: applyUpdate(entityId, sessionId, update)
    API->>SessionController: ApplyUpdate handler
    SessionController->>SessionService: getSessionById(sessionId)
    SessionService-->>SessionController: Session data
    SessionController->>UpdateApplier: applyUpdateToState(state, update)
    UpdateApplier-->>SessionController: Updated state
    SessionController->>SessionService: updateSession(sessionKey, updatedState)
    SessionService-->>SessionController: Success
    SessionController-->>API: { state: updatedState }
    API-->>ResolutionHook: Updated state
    ResolutionHook->>ResolutionHook: Update local state
    ResolutionHook-->>EditComponent: State synchronized
```

### Generic Type System

The system uses TypeScript generics to provide type safety while sharing code:

```mermaid
classDiagram
    class GenericSessionService~TEntityId, TState~ {
        +getSession(entityId, userId) Session
        +createSession(entityId, userId, state) Promise~Session~
        +updateSession(sessionKey, state) Promise~void~
        +deleteSession(sessionKey) Promise~void~
        -config: SessionConfig
        -db: Database
    }
    
    class SessionConfig~TEntityId, TState~ {
        +entityType: 'class' | 'race' | 'character'
        +buildSessionKey(entityId, userId) string
    }
    
    class Session~TEntityId, TState~ {
        +id: string
        +entityId: TEntityId
        +userId: number
        +sessionKey: string
        +state: TState
        +createdAt: Date
        +updatedAt: Date
        +expiresAt: Date
    }
    
    class ClassSessionService {
        +getSession(classId, userId) ClassSession
    }
    
    class RaceSessionService {
        +getSession(raceId, userId) RaceSession
    }
    
    class CharacterSessionService {
        +getSession(characterId, userId) CharacterSession
    }
    
    GenericSessionService~number, ClassEditState~ <|-- ClassSessionService
    GenericSessionService~number, RaceEditState~ <|-- RaceSessionService
    GenericSessionService~number, CharacterEditState~ <|-- CharacterSessionService
    GenericSessionService --> SessionConfig
    GenericSessionService --> Session
```

## Usage Patterns

### Backend Usage

#### Creating a Session Service

```typescript
import { GenericSessionService } from '@/features/shared/session';
import { getClassSessionDatabase } from './sessionDatabase';
import type { ClassEditState } from './types';

const classSessionService = new GenericSessionService<number, ClassEditState>({
    entityType: 'class',
    buildSessionKey: (classId, userId) => `${classId}:${userId}`,
    db: getUnifiedSessionDatabase()
});
```

#### Creating an Update Applier Config

```typescript
import type { UpdateApplierConfig } from '@/features/shared/session';
import type { ClassEditState, ClassUpdate } from './types';

export const classUpdateApplierConfig: UpdateApplierConfig<ClassEditState, ClassUpdate> = {
    applyFieldUpdate: (state, field, value) => ({ ...state, [field]: value }),
    isFieldUpdate: (update) => update.type === 'UPDATE_CLASS_FIELD',
    extractFieldUpdate: (update) => 
        update.type === 'UPDATE_CLASS_FIELD' 
            ? { field: update.payload.field, value: update.payload.value }
            : null,
    // ... other strategies
};
```

#### Using Generic Controller

```typescript
import { initializeSession, getSessionState, applyUpdate, saveSession, cancelSession } from '@/features/shared/session';

const config: SessionControllerConfig<number, ClassEditState, ClassUpdate, DnDClass> = {
    entityService: { getById: classService.getClassById },
    sessionService: classSessionService,
    buildInitialState: (cls) => ({ /* build state from class */ }),
    updateApplierConfig: classUpdateApplierConfig,
    saveService: { saveSessionToMySQL: classSaveService.saveSessionToMySQL },
    getEntityIdFromParams: (params) => parseInt(params.classId),
    getSessionIdFromParams: (params) => params.sessionId
};

// In route handler
export async function InitializeClassSession(req, res, next) {
    await initializeSession(req, res, next, config);
}
```

### Frontend Usage

#### Using Generic Resolution Hook

```typescript
import { useGenericResolution } from '@/lib/hooks/useGenericResolution';
import { ClassResolutionApi } from '@/services/api/ClassResolutionApi';
import type { ClassEditState, ClassUpdate } from '@shared/schema';

export function useClassResolution(classId: number | null) {
    return useGenericResolution<number, ClassEditState, ClassUpdate>(
        classId,
        {
            initializeSession: async (id) => {
                const result = await ClassResolutionApi.initializeSession(id);
                return { sessionId: result.sessionId, state: result.classState };
            },
            getSessionState: async (id, sessionId) => {
                const result = await ClassResolutionApi.getSessionState(id, sessionId);
                return { state: result.classState };
            },
            applyUpdate: async (id, sessionId, update) => {
                const result = await ClassResolutionApi.applyUpdate(id, sessionId, update);
                return { state: result.classState };
            },
            saveSession: ClassResolutionApi.saveSession,
            cancelSession: ClassResolutionApi.cancelSession
        }
    );
}
```

#### Using State Sync Utilities

```typescript
import { useFieldsSync } from '@/lib/hooks/useStateSync';

// In ClassEdit component
useFieldsSync(
    state,
    resolution.sessionId,
    resolution.applyUpdate,
    {
        getEntityId: () => state.classId,
        buildUpdate: (field, value) => ({ 
            type: 'UPDATE_CLASS_FIELD', 
            payload: { field, value } 
        }),
        shouldSync: (prev, curr) => true,
        fields: ['name', 'abbreviation', 'description']
    }
);
```

## Database Schema

### Redis Session Storage

All entity types (class, race, character) use Redis for session storage with a consistent key pattern structure. Sessions are stored as JSON strings with automatic expiration via Redis TTL.

**Key Patterns**:
- By session key: `session:{entityType}:{sessionKey}` (e.g., `session:class:1:100`)
- By session ID: `session:{entityType}:id:{sessionId}` (e.g., `session:class:id:550e8400-e29b-41d4-a716-446655440000`)
- Index: `session:{entityType}:index:{sessionKey}` → `{sessionId}` (for reverse lookup)

**Data Structure**:
Sessions are stored as JSON strings with the following structure:
```json
{
    "id": "uuid-v4",
    "entityId": 123,
    "userId": 456,
    "sessionKey": "123:456",
    "state": { /* entity-specific state */ },
    "createdAt": 1234567890,
    "updatedAt": 1234567890,
    "expiresAt": 1234567890
}
```

For character sessions, the structure also includes `resolvedResult`:
```json
{
    "id": "uuid-v4",
    "characterId": 123,
    "userId": 456,
    "sessionKey": "123:456",
    "characterState": { /* character edit state */ },
    "resolvedResult": { /* resolved character result */ },
    "createdAt": 1234567890,
    "updatedAt": 1234567890,
    "expiresAt": 1234567890
}
```

**Key Features**:
- **Redis Storage**: High-performance in-memory storage
- **Automatic Expiration**: Redis TTL automatically removes expired sessions (no manual cleanup needed)
- **Entity Type Discriminator**: Key prefixes (`session:class:`, `session:race:`, `session:character:`) organize sessions by entity type
- **Multiple Lookups**: Sessions can be retrieved by session key or session ID
- **TTL Management**: Sessions expire after configurable TTL (default: 30 minutes), extended on each update

**Benefits**:
- High-performance in-memory storage
- Automatic expiration via Redis TTL (no cleanup intervals needed)
- Scalable across multiple backend instances
- Easy to add new entity types (just use new key prefix)
- Consistent structure across all entity types

**Configuration**:
Redis connection is configured via environment variables:
- `REDIS_HOST` (default: localhost)
- `REDIS_PORT` (default: 6379)
- `REDIS_PASSWORD` (optional, if Redis is password-protected)
- `SESSION_EXPIRATION_MINUTES` (default: 30)

## Migration Guide

### Backend Migration Steps

1. **Create Update Applier Config**:
   - Create `{entity}UpdateApplierConfig.ts` with strategy functions
   - Export config object

2. **Update Session Service**:
   - Replace service implementation with wrapper around `GenericSessionService`
   - Provide entity-specific configuration

3. **Update Controller**:
   - Create `SessionControllerConfig` with entity-specific dependencies
   - Replace controller functions with calls to generic controller functions
   - Add response transformation if needed (for different response field names)

4. **Update Update Applier**:
   - Replace implementation with call to `genericApplyUpdateToState`
   - Pass entity-specific config

### Frontend Migration Steps

1. **Update Resolution Hook**:
   - Replace hook implementation with wrapper around `useGenericResolution`
   - Provide entity-specific API configuration
   - Map API responses to generic hook format

2. **Update Edit Component**:
   - Replace manual useEffect sync patterns with `useFieldsSync` or `useFieldSync`
   - Simplify state synchronization logic

## API Reference

### Backend

- [Generic Session Service](../application-overview/session-state-management-backend.md#generic-session-service)
- [Generic Session Controller](../application-overview/session-state-management-backend.md#generic-session-controller)
- [Generic Update Applier](../application-overview/session-state-management-backend.md#generic-update-applier)

### Frontend

- [Generic Resolution Hook](../application-overview/session-state-management-frontend.md#generic-resolution-hook)
- [State Sync Utilities](../application-overview/session-state-management-frontend.md#state-sync-utilities)

## Related Documentation

- [Backend Implementation Patterns](../application-overview/backend-implementation.md) - Common backend patterns
- [Frontend Patterns](../application-overview/frontend-patterns.md) - Common frontend patterns
- [Class System](../class-system/backend-implementation.md) - Class-specific implementation
- [Race System](../race-system/backend-implementation.md) - Race-specific implementation
- [Character System](../character-management/) - Character-specific implementation
