// components/MdxRenderer.jsx
import { useMemo } from 'react';
import { compile } from '@mdx-js/mdx';
import { MDXProvider } from '@mdx-js/react';
import * as runtime from 'react/jsx-runtime';

// Example table component
import TableEmbed from '@/components/ReferenceTable/ReferenceTable';

// Component map for custom syntax
const components = {
  Table: ({ children }) => <TableEmbed slug={children} />,
};

export default function MdxRenderer({ markdown }) {
  const Content = useMemo(() => {
    if (!markdown) return () => null;

    try {
      const code = compile(markdown, { outputFormat: 'function-body' });
      return new Function('React', 'mdx', `${code}`).bind(null, runtime, runtime.jsx);
    } catch (err) {
      console.error('MDX compile error:', err);
      return () => <pre>Error rendering markdown</pre>;
    }
  }, [markdown]);

  return (
    <MDXProvider components={components}>
      <Content />
    </MDXProvider>
  );
}
