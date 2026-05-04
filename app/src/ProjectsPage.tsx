import type { CSSProperties } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { generatedProjectThumbnails } from './generatedProjectThumbnails';
import { publishedProjects, type ProjectArticle } from './projects';

const UNCATEGORIZED = 'General';
const EMPTY_SHELF_COUNT = 2;

function categoryKey(article: ProjectArticle): string {
  const raw = article.frontmatter.category?.trim();
  return raw && raw.length > 0 ? raw : UNCATEGORIZED;
}

type Flyout = { category: string; slug: string };

export default function ProjectsPage() {
  const [flyout, setFlyout] = useState<Flyout | null>(null);

  const shelves = useMemo(() => {
    const map = new Map<string, ProjectArticle[]>();
    for (const article of publishedProjects) {
      const key = categoryKey(article);
      const list = map.get(key) ?? [];
      list.push(article);
      map.set(key, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => {
      if (a === UNCATEGORIZED) return 1;
      if (b === UNCATEGORIZED) return -1;
      return a.localeCompare(b, undefined, { sensitivity: 'base' });
    });
  }, []);

  const showFlyout = useCallback((category: string, slug: string) => {
    setFlyout({ category, slug });
  }, []);

  const hideFlyout = useCallback(() => {
    setFlyout(null);
  }, []);

  return (
    <section className="projects-page projects-wall">
      <h2 className="projects-wall-title">Projects</h2>
      <p className="projects-wall-intro">Boxes on the shelf — hover a box to open it along the plank.</p>

      {shelves.length === 0 ? (
        <p>No published articles yet.</p>
      ) : (
        <div className="projects-wall-board">
          {shelves.map(([label, articles]) => {
            const expanded =
              flyout?.category === label ? articles.find((a) => a.slug === flyout.slug) : undefined;
            const flyoutThumb = expanded
              ? (generatedProjectThumbnails[expanded.slug] ?? expanded.frontmatter.thumbnail?.trim() ?? '')
              : '';

            return (
              <div key={label} className="projects-shelf-block">
                <div className="projects-shelf-track" onMouseLeave={hideFlyout}>
                  <div className="projects-shelf-inner">
                    <div className="projects-shelf-deck">
                      {expanded ? (
                        <div
                          className={`projects-shelf-flyout${
                            flyoutThumb ? ' projects-shelf-flyout--with-thumb' : ''
                          }`}
                          role="presentation"
                        >
                          <div className="projects-shelf-flyout-inner">
                            <div className="projects-shelf-flyout-text">
                              <span className="projects-shelf-flyout-title">{expanded.frontmatter.title}</span>
                              {expanded.frontmatter.summary ? (
                                <span className="projects-shelf-flyout-summary">
                                  {expanded.frontmatter.summary}
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {flyoutThumb ? (
                            <div
                              className="projects-shelf-flyout-thumb"
                              aria-hidden
                              style={
                                {
                                  ['--project-thumb' as string]: `url(${JSON.stringify(flyoutThumb)})`,
                                } as CSSProperties
                              }
                            />
                          ) : null}
                        </div>
                      ) : null}
                      <div className="projects-shelf-boxes">
                        {articles.map((article) => (
                          <Link
                            key={article.slug}
                            className={`project-box${flyout?.slug === article.slug ? ' project-box--active' : ''}`}
                            to={`/projects/${article.slug}`}
                            onMouseEnter={() => showFlyout(label, article.slug)}
                            onFocus={() => showFlyout(label, article.slug)}
                            onBlur={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                                hideFlyout();
                              }
                            }}
                          >
                            <span className="project-box-title">{article.frontmatter.title}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div className="projects-shelf-plank">
                      <span className="projects-shelf-plank-label">{label}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {Array.from({ length: EMPTY_SHELF_COUNT }, (_, i) => (
            <div key={`empty-shelf-${i}`} className="projects-shelf-block projects-shelf-block--empty">
              <div className="projects-shelf-track">
                <div className="projects-shelf-inner">
                  <div className="projects-shelf-deck projects-shelf-deck--empty" />
                  <div className="projects-shelf-plank projects-shelf-plank--empty" aria-hidden />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
