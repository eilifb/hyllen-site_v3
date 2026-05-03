import { Link } from 'react-router-dom';
import { publishedProjects } from './projects';

export default function ProjectsPage() {
  return (
    <section className="projects-page">
      <h2 className="projects-title">Projects</h2>
      <div className="projects-links">
        {publishedProjects.length === 0 ? (
          <p>No published articles yet.</p>
        ) : (
          publishedProjects.map((article) => (
            <Link
              key={article.slug}
              className="project-link"
              to={`/projects/${article.slug}`}
            >
              {article.frontmatter.title}
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
