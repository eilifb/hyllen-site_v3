import { Link } from 'react-router-dom';
import { getRecentPublishedProjects, projectSortKey } from './projects';

const RECENT_LIMIT = 3;

type HomeRecentProjectsProps = {
  placement?: 'header';
};

export default function HomeRecentProjects({ placement }: HomeRecentProjectsProps = {}) {
  const recent = getRecentPublishedProjects(RECENT_LIMIT);
  if (recent.length === 0) return null;

  const sectionClass =
    placement === 'header'
      ? 'home-recent-projects home-recent-projects--header'
      : 'home-recent-projects';

  return (
    <section className={sectionClass} aria-labelledby="home-recent-projects-heading">
      <h2 id="home-recent-projects-heading" className="home-recent-projects-title">
        Newest project updates:
      </h2>
      <ul className="home-recent-projects-list">
        {recent.map((article) => {
          const updated = projectSortKey(article.frontmatter);
          return (
            <li key={article.slug}>
              <Link to={`/projects/${article.slug}`} className="home-recent-projects-link">
                {article.frontmatter.title}
              </Link>
              <time className="home-recent-projects-date" dateTime={updated}>
                {updated}
              </time>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
