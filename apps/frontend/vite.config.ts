import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import svgr from '@svgr/rollup';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react(),
    mdx(),
    svgr({
      svgo: true,
      svgoConfig: {
        plugins: [
          { name: 'removeDimensions' },
          { name: 'removeAttrs', params: { attrs: ['style', 'fill'] } },
          { name: 'addAttributesToSVGElement', params: { attributes: [{ fill: 'currentColor' }] } },
        ],
      },
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  esbuild: {
    loader: 'tsx',
    include: /src\/.*\.[tj]sx?$/,
    exclude: [],
  },
});
