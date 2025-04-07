// Game.test.js

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Game from './Game';
import { BrowserRouter } from 'react-router-dom';
import { SettingsProvider } from '../context/SettingsContext';

// Mock audio play globally
window.HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = jest.fn();

// Utility to wrap with routing and context
const renderWithProviders = (ui) => {
  return render(
    <BrowserRouter>
      <SettingsProvider>
        {ui}
      </SettingsProvider>
    </BrowserRouter>
  );
};

describe('Blackjack Game Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders initial game state', async () => {
    await act(async () => {
      renderWithProviders(<Game />);
    });
    expect(screen.getByText(/dealer/i)).toBeInTheDocument();
    expect(screen.getByText(/player/i)).toBeInTheDocument();
  });

  test('completes full game flow', async () => {
    await act(async () => {
      renderWithProviders(<Game />);
    });

    await act(async () => {
      fireEvent.click(screen.getByAltText('Bet 100'));
    });
    expect(screen.getAllByTestId('player-card')).toHaveLength(2);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /stand/i }));
    });
    
    const result = await screen.findByTestId('result-message');
    expect(result).toBeInTheDocument();
    expect(result).toHaveTextContent(/win|lose|draw/i);

    const playAgainButtons = await screen.findAllByRole('button', { name: /play again/i });
    await act(async () => {
      fireEvent.click(playAgainButtons[0]);
    });
    expect(screen.getByTestId('player-hand')).toBeInTheDocument();
  });

  test('allows player actions after betting', async () => {
    await act(async () => {
      renderWithProviders(<Game />);
    });
    
    await act(async () => {
      fireEvent.click(screen.getByAltText('Bet 100'));
    });
    const initialCards = screen.getAllByTestId('player-card').length;
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /hit/i }));
    });
    expect(screen.getAllByTestId('player-card')).toHaveLength(initialCards + 1);
  });
});
