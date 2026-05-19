import { describe, expect, it } from 'vitest';
import { highlightArticleCodeBlocks } from './highlightArticleCode';

describe('highlightArticleCodeBlocks', () => {
  it('adds panel classes and hljs markup to pre/code', () => {
    const root = document.createElement('article');
    root.innerHTML = `<pre><code>let x = 1;</code></pre>`;

    highlightArticleCodeBlocks(root);

    const pre = root.querySelector('pre');
    const code = root.querySelector('code');
    expect(pre?.classList.contains('mdx-asset-panel')).toBe(true);
    expect(code?.classList.contains('hljs')).toBe(true);
    expect(code?.innerHTML).toContain('hljs-');
  });
});
