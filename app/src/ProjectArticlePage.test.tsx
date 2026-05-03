import { describe, expect, it, vi } from 'vitest';

vi.mock('./MdxModelViewer', () => ({
  default: () => null,
}));

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProjectArticlePage from './ProjectArticlePage';

describe('ProjectArticlePage', () => {
  it('renders demo MDX paragraph (viewer mocked)', () => {
    render(
      <MemoryRouter initialEntries={['/projects/demo']}>
        <Routes>
          <Route path="/projects/:slug" element={<ProjectArticlePage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 2, name: /this is a demo text/i })).toBeInTheDocument();
    expect(screen.getByText(/It features a constant:/i)).toBeInTheDocument();
  });
});
