import React from 'react';
import { Root, RootContent } from 'hast';
import { customComponents } from './RenderHastToReactComponents';

type Props = {
    tree: Root;
};

const blockElements = new Set([
    'address', 'article', 'aside', 'blockquote', 'canvas', 'dd', 'div', 'dl', 'dt',
    'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav', 'noscript', 'ol',
    'output', 'p', 'pre', 'section', 'table', 'tfoot', 'ul', 'video'
]);

const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img',
    'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function renderNode(node: RootContent): React.ReactNode {
    if (node.type === 'text') {
        return node.value;
    }

    if (node.type === 'element') {
        const Tag = customComponents[node.tagName] || node.tagName;

        if (
            Tag === 'p' &&
            node.children.every(
                (c) => c.type === 'element' && blockElements.has(c.tagName)
            )
        ) {
            return node.children.map((c, i) => (
                <React.Fragment key={i}>{renderNode(c)}</React.Fragment>
            ));
        }

        const children = node.children.map((child, i) => (
            <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
        ));

        const { key: rawKey, style, ...otherProps } = node.properties || {};
        const key = typeof rawKey === 'string' || typeof rawKey === 'number' ? rawKey : undefined;

        // Handle style property - convert to React CSSProperties
        const processedStyle = (() => {
            if (!style) return undefined;

            const convertToCamelCase = (str: string): keyof React.CSSProperties =>
                str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase()) as keyof React.CSSProperties;

            const styleObj: Record<string, string | number> = {};

            if (typeof style === 'string') {
                // Parse CSS string format
                style.split(';').forEach(rule => {
                    const [property, value] = rule.split(':').map(s => s.trim());
                    if (property && value) {
                        styleObj[convertToCamelCase(property)] = value;
                    }
                });
            } else if (typeof style === 'object' && style !== null) {
                // Handle HAST style object format
                Object.entries(style).forEach(([key, value]) => {
                    if (typeof value === 'string' || typeof value === 'number') {
                        styleObj[convertToCamelCase(key)] = value;
                    }
                });
            }

            return Object.keys(styleObj).length > 0 ? (styleObj as React.CSSProperties) : undefined;
        })();

        const props = {
            ...otherProps,
            ...(processedStyle ? { style: processedStyle } : {}),
        };

        if (typeof Tag === 'string' && voidElements.has(Tag)) {
            return <Tag key={key} {...props} />;
        }

        return <Tag key={key} {...props}>{children}</Tag>;
    }

    return null;
}

export function RenderHastToReact({ tree }: Props): React.ReactElement {
    return <>{tree.children.map((node, i) => <React.Fragment key={i}>{renderNode(node)}</React.Fragment>)}</>;
}
