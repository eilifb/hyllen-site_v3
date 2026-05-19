import { describe, expect, it } from 'vitest';
import { formatProjectDates, projectSortKey } from './projects';

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
