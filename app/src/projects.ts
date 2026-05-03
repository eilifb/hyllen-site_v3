import type { ComponentType } from 'react';

export interface ProjectFrontmatter {
  title: string;
  slug: string;
  summary?: string;
  date: string;
  thumbnail?: string;
  tags?: string[];
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

export const publishedProjects: ProjectArticle[] = allProjects
  .filter((p) => p.frontmatter.published)
  .sort((a, b) =>
    String(b.frontmatter.date ?? '').localeCompare(String(a.frontmatter.date ?? '')),
  );

export function getPublishedProjectBySlug(slug: string): ProjectArticle | null {
  return publishedProjects.find((p) => p.slug === slug) ?? null;
}
