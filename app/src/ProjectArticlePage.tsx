import { useEffect, useLayoutEffect, useRef } from 'react';
import { MDXProvider } from '@mdx-js/react';
import { Link, useParams } from 'react-router-dom';
import { Has3dModelArticleProvider } from './has3dModelArticleContext';
import MdxArticleImage from './MdxArticleImage';
import MdxModelViewer from './MdxModelViewer';
import { highlightArticleCodeBlocks } from './highlightArticleCode';
import { prefetchModelViewer } from './modelViewerPrefetch';
import { formatProjectDates, getPublishedProjectBySlug } from './projects';

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
  const dateLine = formatProjectDates(frontmatter);
  const articleRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    highlightArticleCodeBlocks(root);
  }, [slug, Component]);

  return (
    <article ref={articleRef} className="projects-page">
      <h2 className="projects-title">{frontmatter.title}</h2>
      <p className="project-meta">{dateLine}</p>
      <Has3dModelArticleProvider enabled={has3dArticle}>
        <MDXProvider components={{ img: MdxArticleImage, MdxModelViewer }}>
          <Component />
        </MDXProvider>
      </Has3dModelArticleProvider>
    </article>
  );
}
