import { Link, useParams } from 'react-router-dom';
import { getPublishedProjectBySlug } from './projects';

export default function ProjectArticlePage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const article = getPublishedProjectBySlug(slug);

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
      <Component />
    </article>
  );
}
