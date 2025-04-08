// Mock audio play globally
window.HTMLMediaElement.prototype.play = jest.fn().mockImplementation(() => Promise.resolve());
window.HTMLMediaElement.prototype.pause = jest.fn();

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Login from './Login';
import { BrowserRouter } from 'react-router-dom';

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
    ...jest.requireActual('firebase/auth'),
    signInWithEmailAndPassword: jest.fn(() => Promise.reject(new Error('Invalid email or password')))
}));

// Helper to wrap component with router
const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Login Component', () => {
    test('renders email and password inputs', async () => {
        await act(async () => {
            renderWithRouter(<Login />);
        });

        // Check for email input
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

        // Check for password input
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();

        // Check for login button
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    });

    test('shows error when login fails', async () => {
        await act(async () => {
            renderWithRouter(<Login />);
        });

        await act(async () => {
            fireEvent.change(screen.getByLabelText(/email/i), {
                target: { value: 'test@example.com' },
            });
            fireEvent.change(screen.getByLabelText(/password/i), {
                target: { value: 'wrongpass' },
            });
            fireEvent.click(screen.getByRole('button', { name: /login/i }));
        });

        const errorMessage = await screen.findByTestId('error-msg');
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage.textContent.toLowerCase()).toMatch(/invalid/);
    });
});
