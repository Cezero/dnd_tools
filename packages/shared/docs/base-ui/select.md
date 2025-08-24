---
title: Select
subtitle: A common form component for choosing a predefined value in a dropdown menu.
description: A high-quality, unstyled React select component that allows you for choosing a predefined value in a dropdown menu.
---

# Select

A high-quality, unstyled React select component that allows you for choosing a predefined value in a dropdown menu.

## Demo

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Select } from '@base-ui-components/react/select';

const fonts = [
  { label: 'Select font', value: null },
  { label: 'Sans-serif', value: 'sans' },
  { label: 'Serif', value: 'serif' },
  { label: 'Monospace', value: 'mono' },
  { label: 'Cursive', value: 'cursive' },
];

export default function ExampleSelect() {
  return (
    <Select.Root items={fonts}>
      <Select.Trigger className="flex h-10 min-w-36 items-center justify-between gap-3 rounded-md border border-gray-200 pr-3 pl-3.5 text-base text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 data-[popup-open]:bg-gray-100 cursor-default">
        <Select.Value />
        <Select.Icon className="flex">
          <ChevronUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className="outline-none select-none z-10" sideOffset={8}>
          <Select.ScrollUpArrow className="top-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] data-[direction=down]:bottom-0 data-[direction=down]:before:bottom-[-100%]" />
          <Select.Popup className="group max-h-[var(--available-height)] origin-[var(--transform-origin)] overflow-y-auto rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
            {fonts.map(({ label, value }) => (
              <Select.Item
                key={label}
                value={value}
                className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4 data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-gray-50 data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-gray-900 pointer-coarse:py-2.5 pointer-coarse:text-[0.925rem]"
              >
                <Select.ItemIndicator className="col-start-1">
                  <CheckIcon className="size-3" />
                </Select.ItemIndicator>
                <Select.ItemText className="col-start-2">{label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Popup>
          <Select.ScrollDownArrow className="bottom-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] data-[direction=down]:bottom-0 data-[direction=down]:before:bottom-[-100%]" />
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
```

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Select {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  height: 2.5rem;
  padding-left: 0.875rem;
  padding-right: 0.75rem;
  margin: 0;
  outline: 0;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--color-gray-900);
  cursor: default;
  -webkit-user-select: none;
  user-select: none;
  min-width: 9rem;

  @media (hover: hover) {
    &:hover {
      background-color: var(--color-gray-100);
    }
  }

  &[data-popup-open] {
    background-color: var(--color-gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}

.SelectIcon {
  display: flex;
}

.Positioner {
  outline: none;
  z-index: 1;
  -webkit-user-select: none;
  user-select: none;
}

.Popup {
  box-sizing: border-box;
  padding-block: 0.25rem;
  border-radius: 0.375rem;
  background-color: canvas;
  color: var(--color-gray-900);
  transform-origin: var(--transform-origin);
  transition:
    transform 150ms,
    opacity 150ms;
  overflow-y: auto;
  max-height: var(--available-height);

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
    transform: scale(0.9);
  }

  &[data-side='none'] {
    transition: none;
    transform: none;
    opacity: 1;
  }

  @media (prefers-color-scheme: light) {
    outline: 1px solid var(--color-gray-200);
    box-shadow:
      0 10px 15px -3px var(--color-gray-200),
      0 4px 6px -4px var(--color-gray-200);
  }

  @media (prefers-color-scheme: dark) {
    outline: 1px solid var(--color-gray-300);
    outline-offset: -1px;
  }
}

.Arrow {
  display: flex;

  &[data-side='top'] {
    bottom: -8px;
    rotate: 180deg;
  }

  &[data-side='bottom'] {
    top: -8px;
    rotate: 0deg;
  }

  &[data-side='left'] {
    right: -13px;
    rotate: 90deg;
  }

  &[data-side='right'] {
    left: -13px;
    rotate: -90deg;
  }
}

.ArrowFill {
  fill: canvas;
}

.ArrowOuterStroke {
  @media (prefers-color-scheme: light) {
    fill: var(--color-gray-200);
  }
}

.ArrowInnerStroke {
  @media (prefers-color-scheme: dark) {
    fill: var(--color-gray-300);
  }
}

.Item {
  box-sizing: border-box;
  outline: 0;
  font-size: 0.875rem;
  line-height: 1rem;
  padding-block: 0.5rem;
  padding-left: 0.625rem;
  padding-right: 1rem;
  min-width: var(--anchor-width);
  display: grid;
  gap: 0.5rem;
  align-items: center;
  grid-template-columns: 0.75rem 1fr;
  cursor: default;
  -webkit-user-select: none;
  user-select: none;
  scroll-margin-block: 1rem;

  @media (pointer: coarse) {
    padding-block: 0.625rem;
    font-size: 0.925rem;
  }

  [data-side='none'] & {
    font-size: 1rem;
    padding-right: 3rem;
    min-width: calc(var(--anchor-width) + 1rem);
  }

  &[data-highlighted] {
    z-index: 0;
    position: relative;
    color: var(--color-gray-50);
  }

  &[data-highlighted]::before {
    content: '';
    z-index: -1;
    position: absolute;
    inset-block: 0;
    inset-inline: 0.25rem;
    border-radius: 0.25rem;
    background-color: var(--color-gray-900);
  }
}

.ItemIndicator {
  grid-column-start: 1;
}

.ItemIndicatorIcon {
  display: block;
  width: 0.75rem;
  height: 0.75rem;
}

.ItemText {
  grid-column-start: 2;
}

.ScrollArrow {
  width: 100%;
  background: canvas;
  z-index: 1;
  text-align: center;
  cursor: default;
  border-radius: 0.375rem;
  height: 1rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
  }

  &[data-direction='up'] {
    &::before {
      top: -100%;
    }
  }

  &[data-direction='down'] {
    bottom: 0;

    &::before {
      bottom: -100%;
    }
  }
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import styles from './index.module.css';

const fonts = [
  { label: 'Select font', value: null },
  { label: 'Sans-serif', value: 'sans' },
  { label: 'Serif', value: 'serif' },
  { label: 'Monospace', value: 'mono' },
  { label: 'Cursive', value: 'cursive' },
];

export default function ExampleSelect() {
  return (
    <Select.Root items={fonts}>
      <Select.Trigger className={styles.Select}>
        <Select.Value />
        <Select.Icon className={styles.SelectIcon}>
          <ChevronUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner className={styles.Positioner} sideOffset={8}>
          <Select.ScrollUpArrow className={styles.ScrollArrow} />
          <Select.Popup className={styles.Popup}>
            {fonts.map(({ label, value }) => (
              <Select.Item key={label} value={value} className={styles.Item}>
                <Select.ItemIndicator className={styles.ItemIndicator}>
                  <CheckIcon className={styles.ItemIndicatorIcon} />
                </Select.ItemIndicator>
                <Select.ItemText className={styles.ItemText}>{label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Popup>
          <Select.ScrollDownArrow className={styles.ScrollArrow} />
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
```

## Anatomy

Import the component and assemble its parts:

```jsx title="Anatomy"
import { Select } from '@base-ui-components/react/select';

<Select.Root>
  <Select.Trigger>
    <Select.Value />
    <Select.Icon />
  </Select.Trigger>

  <Select.Portal>
    <Select.Backdrop />
    <Select.Positioner>
      <Select.ScrollUpArrow />
      <Select.Popup>
        <Select.Arrow />
        <Select.Item>
          <Select.ItemText />
          <Select.ItemIndicator />
        </Select.Item>
        <Select.Separator />
        <Select.Group>
          <Select.GroupLabel />
        </Select.Group>
      </Select.Popup>
      <Select.ScrollDownArrow />
    </Select.Positioner>
  </Select.Portal>
</Select.Root>;
```

## API reference

### Root

Groups all parts of the select.
Doesn’t render its own HTML element.

**Root Props:**

| Prop                                                                   | Type                                                                                                      | Default | Description                                                                                                                                                                                                                                                             |
| :--------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- | :------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name                                                                   | `string`                                                                                                  | -       | Identifies the field when a form is submitted.                                                                                                                                                                                                                          |
| defaultValue                                                           | `Value[] \| Value \| null`                                                                                | `null`  | The uncontrolled value of the select when it’s initially rendered.To render a controlled select, use the `value` prop instead.                                                                                                                                          |
| value                                                                  | `Value[] \| Value \| null`                                                                                | -       | The value of the select.                                                                                                                                                                                                                                                |
| onValueChange                                                          | `((value: Value[] \| Value, event: Event \| undefined) => void)`                                          | -       | Callback fired when the value of the select changes. Use when controlled.                                                                                                                                                                                               |
| defaultOpen                                                            | `boolean`                                                                                                 | `false` | Whether the select menu is initially open.To render a controlled select menu, use the `open` prop instead.                                                                                                                                                              |
| open                                                                   | `boolean`                                                                                                 | -       | Whether the select menu is currently open.                                                                                                                                                                                                                              |
| onOpenChange                                                           | `((open: boolean, event: Event \| undefined, reason: Select.Root.OpenChangeReason \| undefined) => void)` | -       | Event handler called when the select menu is opened or closed.                                                                                                                                                                                                          |
| actionsRef                                                             | `RefObject<Select.Root.Actions>`                                                                          | -       | A ref to imperative actions.\* `unmount`: When specified, the select will not be unmounted when closed.&#xA;Instead, the `unmount` function must be called to unmount the select manually.&#xA;Useful when the select's animation is controlled by an external library. |
| items                                                                  | `Record<string, ReactNode> \| ({ label: ReactNode, value: Value })[]`                                     | -       | Data structure of the items rendered in the select menu.&#xA;When specified, `<Select.Value>` renders the label of the selected item instead of the raw value.                                                                                                          |
| modal                                                                  | `boolean`                                                                                                 | `true`  | Determines if the select enters a modal state when open.\* `true`: user interaction is limited to the select: document page scroll is locked and and pointer interactions on outside elements are disabled.                                                             |
| \* `false`: user interaction with the rest of the document is allowed. |
| multiple                                                               | `boolean \| undefined`                                                                                    | `false` | Whether multiple items can be selected.                                                                                                                                                                                                                                 |
| onOpenChangeComplete                                                   | `((open: boolean) => void)`                                                                               | -       | Event handler called after any animations complete when the select menu is opened or closed.                                                                                                                                                                            |
| disabled                                                               | `boolean`                                                                                                 | `false` | Whether the component should ignore user interaction.                                                                                                                                                                                                                   |
| readOnly                                                               | `boolean`                                                                                                 | `false` | Whether the user should be unable to choose a different option from the select menu.                                                                                                                                                                                    |
| required                                                               | `boolean`                                                                                                 | `false` | Whether the user must choose a value before submitting a form.                                                                                                                                                                                                          |
| inputRef                                                               | `Ref<HTMLInputElement>`                                                                                   | -       | A ref to access the hidden input element.                                                                                                                                                                                                                               |
| id                                                                     | `string`                                                                                                  | -       | The id of the Select.                                                                                                                                                                                                                                                   |
| children                                                               | `ReactNode`                                                                                               | -       | -                                                                                                                                                                                                                                                                       |

### Trigger

A button that opens the select menu.
Renders a `<div>` element.

**Trigger Props:**

| Prop         | Type                                                                                | Default | Description                                                                                                                                                                                  |
| :----------- | :---------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nativeButton | `boolean`                                                                           | `false` | Whether the component renders a native `<button>` element when replacing it&#xA;via the `render` prop.&#xA;Set to `true` if the rendered element is a native button.                         |
| disabled     | `boolean`                                                                           | `false` | Whether the component should ignore user interaction.                                                                                                                                        |
| children     | `ReactNode`                                                                         | -       | -                                                                                                                                                                                            |
| className    | `string \| ((state: Select.Trigger.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render       | `ReactElement \| ((props: HTMLProps, state: Select.Trigger.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Trigger Data Attributes:**

| Attribute       | Type | Description                                                               |
| :-------------- | :--- | :------------------------------------------------------------------------ |
| data-popup-open | -    | Present when the corresponding select is open.                            |
| data-pressed    | -    | Present when the trigger is pressed.                                      |
| data-disabled   | -    | Present when the select is disabled.                                      |
| data-readonly   | -    | Present when the select is readonly.                                      |
| data-required   | -    | Present when the select is required.                                      |
| data-valid      | -    | Present when the select is in valid state (when wrapped in Field.Root).   |
| data-invalid    | -    | Present when the select is in invalid state (when wrapped in Field.Root). |
| data-dirty      | -    | Present when the select's value has changed (when wrapped in Field.Root). |
| data-touched    | -    | Present when the select has been touched (when wrapped in Field.Root).    |
| data-filled     | -    | Present when the select has a value (when wrapped in Field.Root).         |
| data-focused    | -    | Present when the select trigger is focused (when wrapped in Field.Root).  |

### Value

A text label of the currently selected item.
Renders a `<span>` element.

**Value Props:**

| Prop      | Type                                                                              | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children  | `ReactNode \| ((value: any) => ReactNode)`                                        | -       | Accepts a function that returns a `ReactNode` to format the selected value.                                                                                                                  |
| className | `string \| ((state: Select.Value.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: HTMLProps, state: Select.Value.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Icon

An icon that indicates that the trigger button opens a select menu.
Renders a `<span>` element.

**Icon Props:**

| Prop      | Type                                                                             | Default | Description                                                                                                                                                                                  |
| :-------- | :------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: Select.Icon.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: HTMLProps, state: Select.Icon.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Backdrop

An overlay displayed beneath the menu popup.
Renders a `<div>` element.

**Backdrop Props:**

| Prop      | Type                                                                                 | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: Select.Backdrop.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: HTMLProps, state: Select.Backdrop.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Backdrop Data Attributes:**

| Attribute           | Type | Description                               |
| :------------------ | :--- | :---------------------------------------- |
| data-open           | -    | Present when the select is open.          |
| data-closed         | -    | Present when the select is closed.        |
| data-starting-style | -    | Present when the select is animating in.  |
| data-ending-style   | -    | Present when the select is animating out. |

### Portal

A portal element that moves the popup to a different part of the DOM.
By default, the portal element is appended to `<body>`.

**Portal Props:**

| Prop      | Type                                                                                | Default | Description                                         |
| :-------- | :---------------------------------------------------------------------------------- | :------ | :-------------------------------------------------- |
| container | `HTMLElement \| ShadowRoot \| RefObject<HTMLElement \| ShadowRoot \| null> \| null` | -       | A parent element to render the portal element into. |
| children  | `ReactNode`                                                                         | -       | -                                                   |

### Positioner

Positions the select menu popup.
Renders a `<div>` element.

**Positioner Props:**

| Prop                 | Type                           | Default    | Description                                                                                                                                                                                                                                                                                                |
| :------------------- | :----------------------------- | :--------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| alignItemWithTrigger | `boolean`                      | `true`     | Whether the positioner overlaps the trigger so the selected item's text is aligned with the trigger's value text. This only applies to mouse input and is automatically disabled if there is not enough space.                                                                                             |
| collisionAvoidance   | `CollisionAvoidance`           | -          | Determines how to handle collisions when positioning the popup.                                                                                                                                                                                                                                            |
| align                | `'center' \| 'start' \| 'end'` | `'center'` | How to align the popup relative to the specified side.                                                                                                                                                                                                                                                     |
| alignOffset          | `number \| OffsetFunction`     | `0`        | Additional offset along the alignment axis in pixels.&#xA;Also accepts a function that returns the offset to read the dimensions of the anchor&#xA;and positioner elements, along with its side and alignment.\* `data.anchor`: the dimensions of the anchor element with properties `width` and `height`. |

- `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
- `data.side`: which side of the anchor element the positioner is aligned against.
- `data.align`: how the positioner is aligned relative to the specified side. |
  | side | `Side` | `'bottom'` | Which side of the anchor element to align the popup against.&#xA;May automatically change to avoid collisions. |
  | sideOffset | `number \| OffsetFunction` | `0` | Distance between the anchor and the popup in pixels.&#xA;Also accepts a function that returns the distance to read the dimensions of the anchor&#xA;and positioner elements, along with its side and alignment.\* `data.anchor`: the dimensions of the anchor element with properties `width` and `height`.
- `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
- `data.side`: which side of the anchor element the positioner is aligned against.
- `data.align`: how the positioner is aligned relative to the specified side. |
  | arrowPadding | `number` | `5` | Minimum distance to maintain between the arrow and the edges of the popup.Use it to prevent the arrow element from hanging out of the rounded corners of a popup. |
  | anchor | `Element \| RefObject<Element \| null> \| VirtualElement \| (() => Element \| VirtualElement \| null) \| null` | - | An element to position the popup against.&#xA;By default, the popup will be positioned against the trigger. |
  | collisionBoundary | `Boundary` | `'clipping-ancestors'` | An element or a rectangle that delimits the area that the popup is confined to. |
  | collisionPadding | `Padding` | `5` | Additional space to maintain from the edge of the collision boundary. |
  | sticky | `boolean` | `false` | Whether to maintain the popup in the viewport after&#xA;the anchor element was scrolled out of view. |
  | positionMethod | `'fixed' \| 'absolute'` | `'absolute'` | Determines which CSS `position` property to use. |
  | trackAnchor | `boolean` | `true` | Whether the popup tracks any layout shift of its positioning anchor. |
  | className | `string \| ((state: Select.Positioner.State) => string)` | - | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state. |
  | render | `ReactElement \| ((props: HTMLProps, state: Select.Positioner.State) => ReactElement)` | - | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Positioner Data Attributes:**

| Attribute          | Type                                                                                 | Description                                                           |
| :----------------- | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| data-open          | -                                                                                    | Present when the select popup is open.                                |
| data-closed        | -                                                                                    | Present when the select popup is closed.                              |
| data-anchor-hidden | -                                                                                    | Present when the anchor is hidden.                                    |
| data-align         | `'start' \| 'center' \| 'end'`                                                       | Indicates how the popup is aligned relative to specified side.        |
| data-side          | `'none' \| 'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the popup is positioned relative to the trigger. |

**Positioner CSS Variables:**

| Variable           | Type     | Default | Description                                                                            |
| :----------------- | :------- | :------ | :------------------------------------------------------------------------------------- |
| --anchor-height    | `number` | -       | The anchor's height.                                                                   |
| --anchor-width     | `number` | -       | The anchor's width.                                                                    |
| --available-height | `number` | -       | The available height between the trigger and the edge of the viewport.                 |
| --available-width  | `number` | -       | The available width between the trigger and the edge of the viewport.                  |
| --transform-origin | `string` | -       | The coordinates that this element is anchored to. Used for animations and transitions. |

### Popup

A container for the select items.
Renders a `<div>` element.

**Popup Props:**

| Prop      | Type                                                                              | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id        | `string`                                                                          | -       | -                                                                                                                                                                                            |
| children  | `ReactNode`                                                                       | -       | \*                                                                                                                                                                                           |
| className | `string \| ((state: Select.Popup.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: HTMLProps, state: Select.Popup.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Popup Data Attributes:**

| Attribute           | Type                                                                                 | Description                                                           |
| :------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| data-open           | -                                                                                    | Present when the select is open.                                      |
| data-closed         | -                                                                                    | Present when the select is closed.                                    |
| data-align          | `'start' \| 'center' \| 'end'`                                                       | Indicates how the popup is aligned relative to specified side.        |
| data-side           | `'none' \| 'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the popup is positioned relative to the trigger. |
| data-starting-style | -                                                                                    | Present when the select is animating in.                              |
| data-ending-style   | -                                                                                    | Present when the select is animating out.                             |

### Arrow

Displays an element positioned against the select menu anchor.
Renders a `<div>` element.

**Arrow Props:**

| Prop      | Type                                                                              | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: Select.Arrow.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: HTMLProps, state: Select.Arrow.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Arrow Data Attributes:**

| Attribute          | Type                                                                                 | Description                                                           |
| :----------------- | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| data-open          | -                                                                                    | Present when the select popup is open.                                |
| data-closed        | -                                                                                    | Present when the select popup is closed.                              |
| data-uncentered    | -                                                                                    | Present when the select arrow is uncentered.                          |
| data-anchor-hidden | -                                                                                    | Present when the anchor is hidden.                                    |
| data-align         | `'start' \| 'center' \| 'end'`                                                       | Indicates how the popup is aligned relative to specified side.        |
| data-side          | `'none' \| 'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the popup is positioned relative to the trigger. |

### Item

An individual option in the select menu.
Renders a `<div>` element.

**Item Props:**

| Prop         | Type                                                                             | Default | Description                                                                                                                                                                                  |
| :----------- | :------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| label        | `string`                                                                         | -       | Specifies the text label to use when the item is matched during keyboard text navigation.Defaults to the item text content if not provided.                                                  |
| value        | `any`                                                                            | `null`  | A unique value that identifies this select item.                                                                                                                                             |
| nativeButton | `boolean`                                                                        | `false` | Whether the component renders a native `<button>` element when replacing it&#xA;via the `render` prop.&#xA;Set to `true` if the rendered element is a native button.                         |
| disabled     | `boolean`                                                                        | `false` | Whether the component should ignore user interaction.                                                                                                                                        |
| children     | `ReactNode`                                                                      | -       | -                                                                                                                                                                                            |
| className    | `string \| ((state: Select.Item.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render       | `ReactElement \| ((props: HTMLProps, state: Select.Item.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**Item Data Attributes:**

| Attribute        | Type | Description                                  |
| :--------------- | :--- | :------------------------------------------- |
| data-selected    | -    | Present when the select item is selected.    |
| data-highlighted | -    | Present when the select item is highlighted. |
| data-disabled    | -    | Present when the select item is disabled.    |

### ItemText

A text label of the select item.
Renders a `<div>` element.

**ItemText Props:**

| Prop      | Type                                                                                 | Default | Description                                                                                                                                                                                  |
| :-------- | :----------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: Select.ItemText.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: HTMLProps, state: Select.ItemText.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### ItemIndicator

Indicates whether the select item is selected.
Renders a `<span>` element.

**ItemIndicator Props:**

| Prop        | Type                                                                                      | Default | Description                                                                                                                                                                                  |
| :---------- | :---------------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| children    | `ReactNode`                                                                               | -       | -                                                                                                                                                                                            |
| className   | `string \| ((state: Select.ItemIndicator.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| keepMounted | `boolean`                                                                                 | `false` | Whether to keep the HTML element in the DOM when the item is not selected.                                                                                                                   |
| render      | `ReactElement \| ((props: HTMLProps, state: Select.ItemIndicator.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### Group

Groups related select items with the corresponding label.
Renders a `<div>` element.

**Group Props:**

| Prop      | Type                                                                              | Default | Description                                                                                                                                                                                  |
| :-------- | :-------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: Select.Group.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: HTMLProps, state: Select.Group.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### GroupLabel

An accessible label that is automatically associated with its parent group.
Renders a `<div>` element.

**GroupLabel Props:**

| Prop      | Type                                                                                   | Default | Description                                                                                                                                                                                  |
| :-------- | :------------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className | `string \| ((state: Select.GroupLabel.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render    | `ReactElement \| ((props: HTMLProps, state: Select.GroupLabel.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

### ScrollUpArrow

An element that scrolls the select menu up when hovered.
Renders a `<div>` element.

**ScrollUpArrow Props:**

| Prop        | Type                                                                                      | Default | Description                                                                                                                                                                                  |
| :---------- | :---------------------------------------------------------------------------------------- | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className   | `string \| ((state: Select.ScrollUpArrow.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| keepMounted | `boolean`                                                                                 | `false` | Whether to keep the HTML element in the DOM while the select menu is not scrollable.                                                                                                         |
| render      | `ReactElement \| ((props: HTMLProps, state: Select.ScrollUpArrow.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**ScrollUpArrow Data Attributes:**

| Attribute           | Type                                                                                 | Description                                                           |
| :------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| data-direction      | `'up'`                                                                               | Indicates the direction of the scroll arrow.                          |
| data-side           | `'none' \| 'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the popup is positioned relative to the trigger. |
| data-visible        | -                                                                                    | Present when the scroll arrow is visible.                             |
| data-starting-style | -                                                                                    | Present when the scroll arrow is animating in.                        |
| data-ending-style   | -                                                                                    | Present when the scroll arrow is animating out.                       |

### ScrollDownArrow

An element that scrolls the select menu down when hovered.
Renders a `<div>` element.

**ScrollDownArrow Props:**

| Prop        | Type                                                                                        | Default | Description                                                                                                                                                                                  |
| :---------- | :------------------------------------------------------------------------------------------ | :------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| className   | `string \| ((state: Select.ScrollDownArrow.State) => string)`                               | -       | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| keepMounted | `boolean`                                                                                   | `false` | Whether to keep the HTML element in the DOM while the select menu is not scrollable.                                                                                                         |
| render      | `ReactElement \| ((props: HTMLProps, state: Select.ScrollDownArrow.State) => ReactElement)` | -       | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

**ScrollDownArrow Data Attributes:**

| Attribute           | Type                                                                                 | Description                                                           |
| :------------------ | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------- |
| data-direction      | `'down'`                                                                             | Indicates the direction of the scroll arrow.                          |
| data-side           | `'none' \| 'top' \| 'bottom' \| 'left' \| 'right' \| 'inline-end' \| 'inline-start'` | Indicates which side the popup is positioned relative to the trigger. |
| data-visible        | -                                                                                    | Present when the scroll arrow is visible.                             |
| data-starting-style | -                                                                                    | Present when the scroll arrow is animating in.                        |
| data-ending-style   | -                                                                                    | Present when the scroll arrow is animating out.                       |

### Separator

A separator element accessible to screen readers.
Renders a `<div>` element.

**Separator Props:**

| Prop        | Type                                                                           | Default        | Description                                                                                                                                                                                  |
| :---------- | :----------------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| orientation | `Orientation`                                                                  | `'horizontal'` | The orientation of the separator.                                                                                                                                                            |
| className   | `string \| ((state: Separator.State) => string)`                               | -              | CSS class applied to the element, or a function that&#xA;returns a class based on the component’s state.                                                                                     |
| render      | `ReactElement \| ((props: HTMLProps, state: Separator.State) => ReactElement)` | -              | Allows you to replace the component’s HTML element&#xA;with a different tag, or compose it with another component.Accepts a `ReactElement` or a function that returns the element to render. |

## Formatting the value

By default, the `Select.Value` component renders the raw `value`.

Passing the `items` prop to `Select.Root` instead renders the matching label for the rendered value:

```jsx title="items prop (Array)" "items"1,3
const items = [
  { value: null, label: 'Select theme' },
  { value: 'system', label: 'System default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

<Select.Root items={items}>
  <Select.Value />
</Select.Root>;
```

```jsx title="items prop (Record)" "items"1,3
const items = {
  null: 'Select theme',
  system: 'System default',
  light: 'Light',
  dark: 'Dark',
};

<Select.Root items={items}>
  <Select.Value />
</Select.Root>;
```

A function can also be passed as the `children` prop of `Select.Value` to render a formatted value:

```jsx title="Lookup map" {8-12}
const items = {
  monospace: 'Monospace',
  serif: 'Serif',
  'san-serif': 'Sans-serif',
};

<Select.Value>
  {(value: keyof typeof items) => (
    <span style={{ fontFamily: value }}>
      {items[value]}
    </span>
  )}
</Select.Value>;
```

## Multiple selection

Add the `multiple` prop to the `Select.Root` component to allow multiple selections.

## Demo

### Tailwind

This example shows how to implement the component using Tailwind CSS.

```tsx
/* index.tsx */
import * as React from 'react';
import { Select } from '@base-ui-components/react/select';

const languages = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  csharp: 'C#',
  php: 'PHP',
  cpp: 'C++',
  rust: 'Rust',
  go: 'Go',
  swift: 'Swift',
};

type Language = keyof typeof languages;

const values = Object.keys(languages) as Language[];

function renderValue(value: Language[]) {
  if (value.length === 0) {
    return 'Select languages...';
  }

  const firstLanguage = languages[value[0]];
  const additionalLanguages = value.length > 1 ? ` (+${value.length - 1} more)` : '';
  return firstLanguage + additionalLanguages;
}

export default function MultiSelectExample() {
  return (
    <Select.Root multiple defaultValue={['javascript', 'typescript']}>
      <Select.Trigger className="flex h-10 min-w-[14rem] items-center justify-between gap-3 rounded-md border border-gray-200 pr-3 pl-3.5 text-base text-gray-900 select-none hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-blue-800 data-[popup-open]:bg-gray-100">
        <Select.Value>{renderValue}</Select.Value>
        <Select.Icon className="flex">
          <ChevronUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className="outline-none z-10"
          sideOffset={8}
          alignItemWithTrigger={false}
        >
          <Select.ScrollUpArrow className="top-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] data-[direction=down]:bottom-0 data-[direction=down]:before:bottom-[-100%]" />
          <Select.Popup className="group max-h-[var(--available-height)] origin-[var(--transform-origin)] overflow-y-auto rounded-md bg-[canvas] py-1 text-gray-900 shadow-lg shadow-gray-200 outline outline-1 outline-gray-200 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[side=none]:data-[ending-style]:transition-none data-[starting-style]:scale-90 data-[starting-style]:opacity-0 data-[side=none]:data-[starting-style]:scale-100 data-[side=none]:data-[starting-style]:opacity-100 data-[side=none]:data-[starting-style]:transition-none dark:shadow-none dark:-outline-offset-1 dark:outline-gray-300">
            {values.map((value) => (
              <Select.Item
                key={value}
                value={value}
                className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-2 pr-4 pl-2.5 text-sm leading-4 outline-none select-none group-data-[side=none]:min-w-[calc(var(--anchor-width)+1rem)] group-data-[side=none]:pr-12 group-data-[side=none]:text-base group-data-[side=none]:leading-4 pointer-coarse:py-2.5 pointer-coarse:text-[0.925rem] [@media(hover:hover)]:[&[data-highlighted]]:relative [@media(hover:hover)]:[&[data-highlighted]]:z-0 [@media(hover:hover)]:[&[data-highlighted]]:text-gray-50 [@media(hover:hover)]:[&[data-highlighted]]:before:content-[''] [@media(hover:hover)]:[&[data-highlighted]]:before:absolute [@media(hover:hover)]:[&[data-highlighted]]:before:inset-y-0 [@media(hover:hover)]:[&[data-highlighted]]:before:inset-x-1 [@media(hover:hover)]:[&[data-highlighted]]:before:rounded-sm [@media(hover:hover)]:[&[data-highlighted]]:before:bg-gray-900 [@media(hover:hover)]:[&[data-highlighted]]:before:z-[-1]"
              >
                <Select.ItemIndicator className="col-start-1">
                  <CheckIcon className="size-3" />
                </Select.ItemIndicator>
                <Select.ItemText className="col-start-2">{languages[value]}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Popup>
          <Select.ScrollDownArrow className="bottom-0 z-[1] flex h-4 w-full cursor-default items-center justify-center rounded-md bg-[canvas] text-center text-xs before:absolute before:top-[-100%] before:left-0 before:h-full before:w-full before:content-[''] data-[direction=down]:bottom-0 data-[direction=down]:before:bottom-[-100%]" />
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
```

### CSS Modules

This example shows how to implement the component using CSS Modules.

```css
/* index.module.css */
.Select {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  height: 2.5rem;
  padding-left: 0.875rem;
  padding-right: 0.75rem;
  margin: 0;
  outline: 0;
  border: 1px solid var(--color-gray-200);
  border-radius: 0.375rem;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.5rem;
  color: var(--color-gray-900);
  cursor: default;
  user-select: none;
  min-width: 14rem;

  @media (hover: hover) {
    &:hover {
      background-color: var(--color-gray-100);
    }
  }

  &[data-popup-open] {
    background-color: var(--color-gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--color-blue);
    outline-offset: -1px;
  }
}

.SelectIcon {
  display: flex;
}

.Positioner {
  outline: none;
  z-index: 1;
}

.Popup {
  box-sizing: border-box;
  padding-block: 0.25rem;
  border-radius: 0.375rem;
  background-color: canvas;
  color: var(--color-gray-900);
  transform-origin: var(--transform-origin);
  transition:
    transform 150ms,
    opacity 150ms;
  overflow-y: auto;
  max-height: var(--available-height);

  &[data-starting-style],
  &[data-ending-style] {
    opacity: 0;
    transform: scale(0.9);
  }

  &[data-side='none'] {
    transition: none;
    transform: none;
    opacity: 1;
  }

  @media (prefers-color-scheme: light) {
    outline: 1px solid var(--color-gray-200);
    box-shadow:
      0 10px 15px -3px var(--color-gray-200),
      0 4px 6px -4px var(--color-gray-200);
  }

  @media (prefers-color-scheme: dark) {
    outline: 1px solid var(--color-gray-300);
    outline-offset: -1px;
  }
}

.Item {
  box-sizing: border-box;
  outline: 0;
  font-size: 0.875rem;
  line-height: 1rem;
  padding-block: 0.5rem;
  padding-left: 0.625rem;
  padding-right: 1rem;
  min-width: var(--anchor-width);
  display: grid;
  gap: 0.5rem;
  align-items: center;
  grid-template-columns: 0.75rem 1fr;
  cursor: default;
  user-select: none;
  scroll-margin-block: 0.25rem;

  @media (pointer: coarse) {
    padding-block: 0.625rem;
    font-size: 0.925rem;
  }

  [data-side='none'] & {
    font-size: 1rem;
    padding-right: 3rem;
    min-width: calc(var(--anchor-width) + 1rem);
  }

  @media (hover: hover) {
    &[data-highlighted] {
      z-index: 0;
      position: relative;
      color: var(--color-gray-50);
    }

    &[data-highlighted]::before {
      content: '';
      z-index: -1;
      position: absolute;
      inset-block: 0;
      inset-inline: 0.25rem;
      border-radius: 0.25rem;
      background-color: var(--color-gray-900);
    }
  }
}

.ItemIndicator {
  grid-column-start: 1;
}

.ItemIndicatorIcon {
  display: block;
  width: 0.75rem;
  height: 0.75rem;
}

.ItemText {
  grid-column-start: 2;
}

.ScrollArrow {
  width: 100%;
  background: canvas;
  z-index: 1;
  text-align: center;
  cursor: default;
  border-radius: 0.375rem;
  height: 1rem;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
  }

  &[data-direction='up'] {
    top: 0;

    &::before {
      top: -100%;
    }
  }

  &[data-direction='down'] {
    bottom: 0;

    &::before {
      bottom: -100%;
    }
  }
}
```

```tsx
/* index.tsx */
import * as React from 'react';
import { Select } from '@base-ui-components/react/select';
import styles from './index.module.css';

const languages = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  csharp: 'C#',
  php: 'PHP',
  cpp: 'C++',
  rust: 'Rust',
  go: 'Go',
  swift: 'Swift',
};

type Language = keyof typeof languages;

const values = Object.keys(languages) as Language[];

function renderValue(value: Language[]) {
  if (value.length === 0) {
    return 'Select languages...';
  }

  const firstLanguage = languages[value[0]];
  const additionalLanguages = value.length > 1 ? ` (+${value.length - 1} more)` : '';
  return firstLanguage + additionalLanguages;
}

export default function MultiSelectExample() {
  return (
    <Select.Root multiple defaultValue={['javascript', 'typescript']}>
      <Select.Trigger className={styles.Select}>
        <Select.Value>{renderValue}</Select.Value>
        <Select.Icon className={styles.SelectIcon}>
          <ChevronUpDownIcon />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner
          className={styles.Positioner}
          sideOffset={8}
          alignItemWithTrigger={false}
        >
          <Select.ScrollUpArrow className={styles.ScrollArrow} />
          <Select.Popup className={styles.Popup}>
            {values.map((value) => (
              <Select.Item key={value} value={value} className={styles.Item}>
                <Select.ItemIndicator className={styles.ItemIndicator}>
                  <CheckIcon className={styles.ItemIndicatorIcon} />
                </Select.ItemIndicator>
                <Select.ItemText className={styles.ItemText}>{languages[value]}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Popup>
          <Select.ScrollDownArrow className={styles.ScrollArrow} />
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

function ChevronUpDownIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      stroke="currentcolor"
      strokeWidth="1.5"
      {...props}
    >
      <path d="M0.5 4.5L4 1.5L7.5 4.5" />
      <path d="M0.5 7.5L4 10.5L7.5 7.5" />
    </svg>
  );
}

function CheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="currentcolor" width="10" height="10" viewBox="0 0 10 10" {...props}>
      <path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
    </svg>
  );
}
```
