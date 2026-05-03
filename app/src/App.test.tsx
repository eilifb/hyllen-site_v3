import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
  });
});
