// components/ReferenceTable.jsx
import { useEffect, useState } from 'react';

export default function ReferenceTable({ slug }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    fetch(`/api/reference-table-html/${slug}`)
      .then(res => res.json())
      .then(data => setHtml(data.html));
  }, [slug]);

  return (
    <div
      className="my-4 prose dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
