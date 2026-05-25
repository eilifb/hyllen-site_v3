import { describe, expect, it } from 'vitest';
import { formatProjectDates, getRecentPublishedProjects, projectSortKey, publishedProjects } from './projects';

describe('formatProjectDates', () => {
  it('shows both when created and updated differ', () => {
    expect(
      formatProjectDates({ title: 't', slug: 't', published: true, created: '2026-04-01', updated: '2026-05-01' }),
    ).toBe('Created 2026-04-01 · Updated 2026-05-01');
  });

  it('shows a single date when created equals updated', () => {
    expect(
      formatProjectDates({ title: 't', slug: 't', published: true, created: '2026-05-03', updated: '2026-05-03' }),
    ).toBe('2026-05-03');
  });
});

describe('projectSortKey', () => {
  it('prefers updated over created', () => {
    expect(
      projectSortKey({ title: 't', slug: 't', published: true, created: '2026-01-01', updated: '2026-06-01' }),
    ).toBe('2026-06-01');
  });
});

describe('getRecentPublishedProjects', () => {
  it('includes every published MDX article in the repo', () => {
    expect(publishedProjects.map((p) => p.slug).sort()).toEqual(['cord_stopper', 'index_animation']);
  });

  it('returns published projects newest first, capped at limit', () => {
    const recent = getRecentPublishedProjects(3);
    expect(recent).toHaveLength(2);
    expect(recent.length).toBeLessThanOrEqual(3);
    expect(recent.length).toBeLessThanOrEqual(publishedProjects.length);
    for (let i = 1; i < recent.length; i += 1) {
      expect(
        projectSortKey(recent[i - 1].frontmatter).localeCompare(
          projectSortKey(recent[i].frontmatter),
        ),
      ).toBeGreaterThanOrEqual(0);
    }
  });
});
