import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const thumbnailUrls = useMemo(
    () =>
      Array.from(
        new Set(
          publishedProjects
            .map((article) =>
              (generatedProjectThumbnails[article.slug] ?? article.frontmatter.thumbnail?.trim() ?? '').trim(),
            )
            .filter(Boolean),
        ),
      ),
    [],
  );

  useEffect(() => {
    if (thumbnailUrls.length === 0) return;

    const preload = () => {
      for (const src of thumbnailUrls) {
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
      }
    };

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(preload, { timeout: 1200 });
      return () => {
        if (typeof win.cancelIdleCallback === 'function') win.cancelIdleCallback(id);
      };
    }

    const timer = window.setTimeout(preload, 120);
    return () => window.clearTimeout(timer);
  }, [thumbnailUrls]);

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
            return (
              <div key={label} className="projects-shelf-block">
                <div className="projects-shelf-track" onMouseLeave={hideFlyout}>
                  <div className="projects-shelf-inner">
                    <div className="projects-shelf-deck">
                      <div className="projects-shelf-boxes">
                        {articles.map((article) => {
                          const isActive = flyout?.slug === article.slug;
                          const thumb =
                            (generatedProjectThumbnails[article.slug] ??
                              article.frontmatter.thumbnail?.trim() ??
                              '') as string;
                          return (
                            <Link
                              key={article.slug}
                              className={`project-box${isActive ? ' project-box--active' : ''}${
                                thumb ? ' project-box--with-thumb' : ''
                              }`}
                              to={`/projects/${article.slug}`}
                              onMouseEnter={() => showFlyout(label, article.slug)}
                              onFocus={() => showFlyout(label, article.slug)}
                              onBlur={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                                  hideFlyout();
                                }
                              }}
                              style={
                                thumb
                                  ? ({
                                      ['--project-thumb' as string]: `url(${JSON.stringify(thumb)})`,
                                    } as CSSProperties)
                                  : undefined
                              }
                            >
                              <span className="project-box-title">{article.frontmatter.title}</span>
                              <span className="project-box-expanded-content" aria-hidden={!isActive}>
                                <span className="project-box-expanded-text">
                                  <span className="project-box-expanded-title">{article.frontmatter.title}</span>
                                  {article.frontmatter.summary ? (
                                    <span className="project-box-expanded-summary">
                                      {article.frontmatter.summary}
                                    </span>
                                  ) : null}
                                </span>
                              </span>
                              {thumb ? (
                                <span
                                  className="project-box-expanded-thumb"
                                  aria-hidden={!isActive}
                                />
                              ) : null}
                            </Link>
                          );
                        })}
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
