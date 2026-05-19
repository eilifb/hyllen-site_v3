import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('json', json);

const SUPPORTED = ['javascript', 'json'] as const;

export function languageFromClassName(className: string): string | undefined {
  const match = className.match(/(?:^|\s)language-([\w+-]+)/);
  return match?.[1];
}

export function inferMdxCodeLanguage(text: string): (typeof SUPPORTED)[number] {
  const trimmed = text.trimStart();
  if (trimmed.startsWith('[') || (trimmed.startsWith('{') && trimmed.includes('"'))) {
    return 'json';
  }
  return 'javascript';
}

export function highlightMdxCode(text: string, language?: string): string {
  if (!text) return '';

  const lang = language && hljs.getLanguage(language) ? language : inferMdxCodeLanguage(text);

  try {
    return hljs.highlight(text, { language: lang, ignoreIllegals: true }).value;
  } catch {
    return hljs.highlightAuto(text, [...SUPPORTED]).value;
  }
}
