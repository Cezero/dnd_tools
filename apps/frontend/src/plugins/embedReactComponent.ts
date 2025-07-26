import type { Element } from 'hast';

export function embedReactComponent(
    componentName: string,
    props: Record<string, any> = {},
): Element {
    return {
        type: 'element',
        tagName: componentName,
        properties: props,
        children: [],
    };
}
