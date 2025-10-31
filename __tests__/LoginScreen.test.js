import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../app/(tabs)/auth/LoginScreen';

// Mocks
jest.mock('@/config/index', () => ({
  __esModule: true,
  default: { post: jest.fn() },
  post: jest.fn(),
}));

jest.mock('components/Navbar', () => () => null);

// Define the mock entirely within the factory to avoid out-of-scope references
jest.mock('@/context/AuthContext', () => {
  const loginMock = jest.fn();
  return {
    __esModule: true,
    useAuth: () => ({ login: loginMock }),
    // Export the mock for test assertions
    loginMock,
  };
});

import API from '@/config/index';
import { loginMock } from '@/context/AuthContext';

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('submits email and password and calls API and login', async () => {
    const token = 'jwt-token-123';
    API.post.mockResolvedValue({ data: { token } });

    const { getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('login_email_input'), 'user@example.com');
    fireEvent.changeText(getByTestId('login_password_input'), 'secret123');
    fireEvent.press(getByTestId('login_submit_button'));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/login', {
        email: 'user@example.com',
        password: 'secret123',
      });
    });

    expect(loginMock).toHaveBeenCalledWith(token);
  });

  it('shows validation errors for invalid email', async () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByTestId('login_email_input'), 'bad-email');
    fireEvent.changeText(getByTestId('login_password_input'), 'short');
    fireEvent.press(getByTestId('login_submit_button'));

    // Wait for potential validation error render
    await waitFor(() => {
      expect(getByText(/invalid email/i)).toBeTruthy();
    });
  });
});
