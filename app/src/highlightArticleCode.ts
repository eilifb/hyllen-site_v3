import { highlightMdxCode, inferMdxCodeLanguage, languageFromClassName } from './mdxHighlight';

/** Highlight <pre><code> in article MDX (including explicit JSX blocks). */
export function highlightArticleCodeBlocks(root: HTMLElement): void {
  root.querySelectorAll('pre').forEach((pre) => {
    if (pre.dataset.mdxHighlighted === 'true') return;

    const code = pre.querySelector(':scope > code');
    if (!code) return;

    const text = code.textContent ?? '';
    if (!text.trim()) return;

    const language =
      languageFromClassName(pre.className) ||
      languageFromClassName(code.className) ||
      inferMdxCodeLanguage(text);

    pre.classList.add('mdx-inline-code', 'mdx-asset-panel');
    code.className = `hljs language-${language}`;
    code.innerHTML = highlightMdxCode(text, language);
    pre.dataset.mdxHighlighted = 'true';
  });
}
