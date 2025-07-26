import type { MarkdownComponentProps } from '@/plugins/types';
import { RenderHastToReact } from './RenderHastToReact';
import { useMarkdownHast } from './markdownCache';

export function RenderMarkdown(props: MarkdownComponentProps): React.JSX.Element {
    const hast = useMarkdownHast(props);
    return <RenderHastToReact tree={hast} />
}
