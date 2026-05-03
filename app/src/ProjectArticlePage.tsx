import { useEffect } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { Link, useParams } from 'react-router-dom';
import { Has3dModelArticleProvider } from './has3dModelArticleContext';
import MdxArticleImage from './MdxArticleImage';
import MdxModelViewer from './MdxModelViewer';
import { prefetchModelViewer } from './modelViewerPrefetch';
import { getPublishedProjectBySlug } from './projects';

export default function ProjectArticlePage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const article = getPublishedProjectBySlug(slug);
  const has3dArticle = Boolean(article?.frontmatter.has3dModel);

  useEffect(() => {
    if (has3dArticle) prefetchModelViewer();
  }, [slug, has3dArticle]);

  if (!article) {
    return (
      <section className="projects-page">
        <h2 className="projects-title">Article not found</h2>
        <Link className="project-link" to="/projects">
          Back to projects
        </Link>
      </section>
    );
  }

  const { Component, frontmatter } = article;

  return (
    <article className="projects-page">
      <h2 className="projects-title">{frontmatter.title}</h2>
      {frontmatter.date ? <p className="project-meta">{frontmatter.date}</p> : null}
      <Has3dModelArticleProvider enabled={has3dArticle}>
        <MDXProvider components={{ img: MdxArticleImage, MdxModelViewer }}>
          <Component />
        </MDXProvider>
      </Has3dModelArticleProvider>
    </article>
  );
}
