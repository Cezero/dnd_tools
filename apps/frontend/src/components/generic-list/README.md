# GenericList Component

A comprehensive, reusable list component with filtering, sorting, pagination, and column configuration capabilities.

## Documentation

For complete, up-to-date documentation, see [GenericList Component Documentation](../../../packages/shared/docs/application-overview/generic-list.md) in the application overview.

## Quick Reference

**Main Component**: `GenericList.tsx`  
**Type Definitions**: `types.ts`  
**Filter Functions**: `filterFunctions.ts`

## Basic Usage

```tsx
import { GenericList } from '@/components/generic-list';

<GenericList
  storageKey="myList"
  columns={columns}
  dataFetcher={fetchData}
  itemDesc="items"
/>
```

See the [application overview documentation](../../../packages/shared/docs/application-overview/generic-list.md) for complete usage examples, API reference, and advanced features.
