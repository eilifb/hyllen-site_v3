import type { ComponentType } from 'react';

export interface ProjectFrontmatter {
  title: string;
  slug: string;
  /** Shelf drawer group on /projects. Omit or empty → "General". */
  category?: string;
  summary?: string;
  created: string;
  updated?: string;
  thumbnail?: string;
  tags?: string[];
  /** When true, allows `<MdxModelViewer />` and prefetches `@google/model-viewer` bundles. */
  has3dModel?: boolean;
  published: boolean;
}

export interface ProjectArticle {
  slug: string;
  Component: ComponentType;
  frontmatter: ProjectFrontmatter;
}

interface MdxModule {
  default: ComponentType;
  frontmatter: ProjectFrontmatter;
}

const modules = import.meta.glob<MdxModule>('../content/projects/*.mdx', {
  eager: true,
});

export const allProjects: ProjectArticle[] = Object.values(modules).map((mod) => ({
  slug: mod.frontmatter.slug,
  Component: mod.default,
  frontmatter: mod.frontmatter,
}));

/** Newest first: prefers `updated`, then `created`. */
export function projectSortKey(frontmatter: ProjectFrontmatter): string {
  return (frontmatter.updated ?? frontmatter.created).trim();
}

/** One-line dates for article header; omits redundant “updated” when same as created. */
export function formatProjectDates(frontmatter: ProjectFrontmatter): string {
  const created = frontmatter.created.trim();
  const updated = frontmatter.updated?.trim() ?? '';
  if (updated && updated !== created) {
    return `Created ${created} · Updated ${updated}`;
  }
  return created;
}

export const publishedProjects: ProjectArticle[] = allProjects
  .filter((p) => p.frontmatter.published)
  .sort((a, b) => projectSortKey(b.frontmatter).localeCompare(projectSortKey(a.frontmatter)));

export function getPublishedProjectBySlug(slug: string): ProjectArticle | null {
  return publishedProjects.find((p) => p.slug === slug) ?? null;
}
