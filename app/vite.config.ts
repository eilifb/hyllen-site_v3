import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';

const dirname = path.dirname(fileURLToPath(import.meta.url));

function readVersionFromFile(): string {
  const candidate = path.resolve(dirname, '.env.version');
  if (!fs.existsSync(candidate)) return '';
  const content = fs.readFileSync(candidate, 'utf8');
  const match = content.match(/^VITE_APP_VERSION=(.*)$/m);
  return match ? match[1].trim() : '';
}

const appVersion =
  process.env.VITE_APP_VERSION?.trim() ||
  process.env.REACT_APP_VERSION?.trim() ||
  readVersionFromFile() ||
  '0.0.0';

export default defineConfig({
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react({ include: /\.(jsx|tsx|mdx)$/ }),
  ],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    open: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,
  },
});
