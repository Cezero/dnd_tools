import React from 'react';

import type { MarkdownComponentProps } from '@/plugins/types';

import { useMarkdownHast } from './markdownCache';
import { RenderHastToReact } from './RenderHastToReact';

export function RenderMarkdown(props: MarkdownComponentProps): React.JSX.Element {
    const hast = useMarkdownHast(props);
    return <RenderHastToReact tree={hast} />
}
