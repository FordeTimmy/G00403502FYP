import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login button or loading text', async () => {
  render(<App />);
  expect(screen.getByText(/login|loading/i)).toBeInTheDocument();
});
