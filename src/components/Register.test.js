// Mock audio play globally
window.HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = jest.fn();

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Register from './Register';
import { BrowserRouter } from 'react-router-dom';

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Register Component', () => {
  test('renders all fields', async () => {
    await act(async () => {
      renderWithRouter(<Register />);
    });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  test('shows error when passwords do not match', async () => {
    await act(async () => {
      renderWithRouter(<Register />);
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'user@example.com' },
    });

    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'pass123' },
    });

    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: 'wrongpass' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    const errorMessage = await screen.findByText(/passwords do not match/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
