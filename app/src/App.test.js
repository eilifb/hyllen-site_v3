import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the main page controls', () => {
  render(<App />);
  expect(screen.getByLabelText(/dark mode/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /scale up animation/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /scale down animation/i })).toBeInTheDocument();
});
