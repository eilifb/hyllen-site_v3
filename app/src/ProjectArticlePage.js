import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { compile, run } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import { getPublishedProjectBySlug } from './generatedProjects';
import { getProjectMdxRemarkPlugins } from './mdxRemarkPlugins';

export default function ProjectArticlePage() {
  const { slug = '' } = useParams();
  const article = getPublishedProjectBySlug(slug);
  const [MdxComponent, setMdxComponent] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    if (!article) return undefined;

    setMdxComponent(null);
    setLoadError('');

    async function loadMdx() {
      try {
        const compiled = await compile(article.source, {
          outputFormat: 'function-body',
          development: process.env.NODE_ENV !== 'production',
          remarkPlugins: getProjectMdxRemarkPlugins(),
        });
        const mod = await run(String(compiled), {
          ...runtime,
          development: process.env.NODE_ENV !== 'production',
        });
        if (!active) return;
        setLoadError('');
        setMdxComponent(() => mod.default);
      } catch (error) {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : 'Failed to load article.');
      }
    }

    loadMdx();
    return () => {
      active = false;
    };
  }, [article]);

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

  return (
    <article className="projects-page">
      <h2 className="projects-title">{article.title}</h2>
      <p className="project-meta">{article.date}</p>
      {loadError ? (
        <p>{loadError}</p>
      ) : MdxComponent ? (
        <MdxComponent />
      ) : (
        <p>Loading article...</p>
      )}
    </article>
  );
}
