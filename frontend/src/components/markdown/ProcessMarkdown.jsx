import { useEffect, useState } from 'react';
import { renderMarkdown } from '@/plugins/renderMarkdown';

export default function ProcessMarkdown({ markdown }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    (async () => {
      const rendered = await renderMarkdown(markdown);
      setHtml(rendered);
    })();
  }, [markdown]);

  return (
    <div
      className="prose dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
