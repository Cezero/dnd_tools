import type { Element, Properties } from 'hast';

// Define HAST-compatible component prop types for embedded React components
// Only include properties that are compatible with HAST Properties type
type DiceButtonHastProps = {
    diceType: string;
    className?: string;
    'data-dice'?: string;
    rollNotation?: string;
    disabled?: boolean;
    // Note: onClick and colors are excluded as they're not HAST-compatible
    // These will be handled by the React component when rendering
};

// Component prop mapping - add new components here as needed
type EmbeddedComponentHastProps = {
    dicebutton: DiceButtonHastProps;
    // Future components can be added here:
    // spellbutton: SpellButtonHastProps;
    // classbutton: ClassButtonHastProps;
};

// Type-safe component name
type EmbeddedComponentName = keyof EmbeddedComponentHastProps;

export function embedReactComponent<T extends EmbeddedComponentName>(
    componentName: T,
    props: EmbeddedComponentHastProps[T] = {} as EmbeddedComponentHastProps[T],
): Element {
    return {
        type: 'element',
        tagName: componentName,
        properties: props as Properties,
        children: [],
    };
}

// Export types for use in other files
export type { 
    EmbeddedComponentHastProps, 
    EmbeddedComponentName, 
    DiceButtonHastProps 
};
