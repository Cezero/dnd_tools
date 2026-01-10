import { Root, RootContent } from 'hast';
import React from 'react';

import { EntityLink } from '@/components/entity-link';

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
        // Check if this is an entity link that should be replaced with EntityLink
        if (node.tagName === 'a' && node.properties) {
            const entityType = node.properties['data-entity-type'];
            const entityId = node.properties['data-entity-id'];
            const href = node.properties.href;
            
            if (typeof entityType === 'string' && typeof entityId === 'string' && typeof href === 'string') {
                const id = parseInt(entityId, 10);
                if (!isNaN(id)) {
                    const children = node.children.map((child, i) => (
                        <React.Fragment key={i}>{renderNode(child)}</React.Fragment>
                    ));
                    
                    return (
                        <EntityLink
                            key={typeof node.properties.key === 'string' || typeof node.properties.key === 'number' ? node.properties.key : undefined}
                            entityType={entityType as 'spell' | 'monster' | 'item' | 'feat' | 'class' | 'race' | 'domain'}
                            entityId={id}
                            href={href}
                            className={Array.isArray(node.properties.className) ? node.properties.className.join(' ') : typeof node.properties.className === 'string' ? node.properties.className : 'entity-link'}
                        >
                            {children}
                        </EntityLink>
                    );
                }
            }
        }
        
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
