/// <reference types="vite/client" />
/// <reference types="vitest/globals" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.mdx' {
  import type { ComponentType } from 'react';
  import type { ProjectFrontmatter } from './projects';

  export const frontmatter: ProjectFrontmatter;
  const Component: ComponentType;
  export default Component;
}
