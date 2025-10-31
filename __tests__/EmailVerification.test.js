import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import EmailVerificationScreen from '../app/(tabs)/auth/email-verification';

// Mocks
jest.mock('@/config/index', () => ({
  __esModule: true,
  default: { post: jest.fn() },
  post: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

// use global jest.setup mock for expo-router

import API from '@/config/index';
import * as SecureStore from 'expo-secure-store';

describe('EmailVerificationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies user with code and navigates to home', async () => {
    // Arrange
    SecureStore.getItemAsync.mockResolvedValue('user-123');
    API.post.mockResolvedValue({ data: { status: 'success', token: 'abc123' } });

    const { getByTestId } = render(<EmailVerificationScreen />);

    // Allow state effects to settle
    await waitFor(() => expect(SecureStore.getItemAsync).toHaveBeenCalled());

    // Enter code and submit
    fireEvent.changeText(getByTestId('verification_code_input'), '654321');
    fireEvent.press(getByTestId('verify_button'));

    // Assert API called with proper payload
    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/verify-User-Otp', {
        user_id: 'user-123',
        code: '654321',
      });
    });

    // Assert token persisted via SecureStore on native path
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('authToken', 'abc123');
  });

  it('shows alert if code is empty', async () => {
    SecureStore.getItemAsync.mockResolvedValue('user-123');

    const { getByTestId } = render(<EmailVerificationScreen />);

    await waitFor(() => expect(SecureStore.getItemAsync).toHaveBeenCalled());

    fireEvent.press(getByTestId('verify_button'));

    // Should not call API when code is empty
    expect(API.post).not.toHaveBeenCalled();
  });
});
