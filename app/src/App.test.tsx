import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App shell', () => {
  it('renders the header, menu trigger, and home-page controls', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: /hyllen/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /scale up animation/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /scale down animation/i }),
    ).toBeInTheDocument();
    const recentHeading = screen.getByRole('heading', {
      level: 2,
      name: /newest project updates/i,
    });
    const recentSection = recentHeading.closest('section');
    expect(recentSection).not.toBeNull();
    const items = within(recentSection!).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByRole('link')).toHaveAttribute('href', '/projects/cord_stopper');
    expect(within(items[1]).getByRole('link')).toHaveAttribute('href', '/projects/index_animation');
  });
});
