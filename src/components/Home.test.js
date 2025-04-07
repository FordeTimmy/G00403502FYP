import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from './Home';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { SettingsProvider } from '../context/SettingsContext';

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
useNavigate.mockImplementation(() => mockNavigate);

// Helper to wrap component with providers
const renderWithProviders = () => {
  return render(
    <SettingsProvider>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </SettingsProvider>
  );
};

describe('Home Component', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  test('renders all main buttons', () => {
    renderWithProviders();

    expect(screen.getByRole('button', { name: /quick play/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /how to play/i })).toBeInTheDocument();
  });

  test('navigates to /game on Quick Play click', () => {
    renderWithProviders();
    fireEvent.click(screen.getByRole('button', { name: /quick play/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/game');
  });

  test('navigates to /login on Login click', () => {
    renderWithProviders();
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('opens and closes settings modal', () => {
    renderWithProviders();

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /settings/i }));

    // Use a more specific check for modal header
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: /close/i }));

    // Confirm it's removed from DOM
    expect(screen.queryByRole('heading', { name: /settings/i })).not.toBeInTheDocument();
  });

  test('adjusts volume in settings', () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '80' } });
    expect(slider.value).toBe('80');
  });

  test('toggles dark mode in settings', () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: /settings/i }));
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  test('opens and closes rules modal', () => {
    renderWithProviders();

    fireEvent.click(screen.getByRole('button', { name: /how to play/i }));
    expect(screen.getByText(/how to play blackjack/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(screen.queryByText(/how to play blackjack/i)).not.toBeInTheDocument();
  });
});
