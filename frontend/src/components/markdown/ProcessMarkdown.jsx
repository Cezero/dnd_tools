import { useEffect, useState } from 'react';
import { renderMarkdown } from '@/plugins/renderMarkdown';

export default function ProcessMarkdown({ markdown, userVars = {} }) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    (async () => {
      const rendered = await renderMarkdown({ markdown, userVars });
      setHtml(rendered);
    })();
  }, [markdown, userVars]);

  return (
    <div
      className="prose dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
