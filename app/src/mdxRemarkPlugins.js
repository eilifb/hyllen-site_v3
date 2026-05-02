import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';

/** Same remark pipeline used when compiling project MDX in the browser. */
export function getProjectMdxRemarkPlugins() {
  return [remarkFrontmatter, remarkMdxFrontmatter];
}
