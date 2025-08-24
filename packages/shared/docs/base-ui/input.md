---
title: Input
subtitle: A native input element that automatically works with Field.
description: A high-quality, unstyled React input component.
---

# Input

<Meta name="description" content="A high-quality, unstyled React input component." />

## Demo

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Input } from '@base-ui-components/react/input';

export default function ExampleInput() {
  return (
    <Input
      placeholder="Name"
      className="h-10 w-full max-w-64 rounded-md border border-gray-200 pl-3.5 text-base text-gray-900 focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-blue-800"
    />
  );
}
```

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Input {
  box-sizing: border-box;
  padding-left: 0.875rem;
  margin: 0;
  border: 1px solid var(--color-gray-200);
  width: 100%;
  max-width: 16rem;
  height: 2.5rem;
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 1rem;
  font-weight: normal;
  background-color: transparent;
  color: var(--color-gray-900);

  &:focus {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Input } from '@base-ui-components/react/input';
import styles from './index.module.css';

export default function ExampleInput() {
  return <Input placeholder="Name" className={styles.Input} />;
}
```

## Anatomy

Import the component and use it as a single part:

```jsx title="Anatomy"
import { Input } from '@base-ui-components/react/input';

<Input />;
```

## API reference

A native input element that automatically works with [Field](https://base-ui.com/react/components/field).
Renders an `<input>` element.

**Input Props:**

| Prop          | Type                                                                       | Default | Description                                                                                                                                                                                  |
| :------------ | :------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| defaultValue  | `string \| number \| string[]`                                             | -       | -                                                                                                                                                                                            |
| onValueChange | `((value: string, event: Event) => void)`                                  | -       | Callback fired when the `value` changes. Use when controlled.                                                                                                                                |
| className     | `string \| ((state: Input.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render        | `ReactElement \| ((props: HTMLProps, state: Input.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Input Data Attributes:**

| Attribute     | Type | Description                                 |
| :------------ | :--- | :------------------------------------------ |
| data-disabled | -    | Present when the input is disabled.         |
| data-valid    | -    | Present when the input is in valid state.   |
| data-invalid  | -    | Present when the input is in invalid state. |
| data-dirty    | -    | Present when the input's value has changed. |
| data-touched  | -    | Present when the input has been touched.    |
| data-filled   | -    | Present when the input is filled.           |
| data-focused  | -    | Present when the input is focused.          |
