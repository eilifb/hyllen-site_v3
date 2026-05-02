import { Link } from 'react-router-dom';
import { publishedProjectArticles } from './generatedProjects';

export default function ProjectsPage() {
  return (
    <section className="projects-page">
      <h2 className="projects-title">Projects</h2>
      <div className="projects-links">
        {publishedProjectArticles.length === 0 ? (
          <p>No published articles yet.</p>
        ) : (
          publishedProjectArticles.map((article) => (
            <Link key={article.slug} className="project-link" to={`/projects/${article.slug}`}>
              {article.title}
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
