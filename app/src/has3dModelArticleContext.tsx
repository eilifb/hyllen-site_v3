import { createContext, useContext, type ReactNode } from 'react';

/**
 * Declared via project MDX YAML (`has3dModel: true`). When false, `<MdxModelViewer />`
 * renders nothing so model-viewer script chunks are not loaded.
 */
const Has3dModelArticleContext = createContext(false);

export function Has3dModelArticleProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <Has3dModelArticleContext.Provider value={enabled}>{children}</Has3dModelArticleContext.Provider>
  );
}

export function useHas3dModelArticle(): boolean {
  return useContext(Has3dModelArticleContext);
}
