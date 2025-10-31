// import React from 'react';
// import { render, fireEvent, waitFor } from '@testing-library/react-native';

// // Mock the API module used by RegisterScreen BEFORE importing the component
// jest.mock('@/config/index', () => ({
//   __esModule: true,
//   default: {
//     post: jest.fn(),
//   },
// }));

// // Mock SecureStore to avoid native calls in Jest
// jest.mock('expo-secure-store', () => ({
//   setItemAsync: jest.fn(),
//   getItemAsync: jest.fn(),
//   deleteItemAsync: jest.fn(),
// }));

// import RegistrationScreen from '../app/(tabs)/auth/RegisterScreen';
// import API from '@/config/index';

// describe('RegistrationScreen', () => {
//   it('renders and shows referral when agent selected', async () => {
//     const { getByText, getByPlaceholderText, queryByText } = render(<RegistrationScreen />);
//     // pick agent
//     fireEvent.press(getByText('agent'));
//     await waitFor(() => {
//       expect(getByText('Referral ID (required for agents)')).toBeTruthy();
//     });
//   });

//   it('calls API on submit', async () => {
//     API.post.mockResolvedValue({
//       data: { token: 'abcd', user: { id: 1, email: 'test@example.com' } },
//     });

//     const { getByText, getAllByText, getByLabelText, getByDisplayValue, getByPlaceholderText } = render(<RegistrationScreen />);
//     // fill minimal required fields
//     fireEvent.changeText(getByPlaceholderText('Surname'), 'Doe');

//     // because above might be complex to target, simpler approach: find inputs by index isn't shown.
//     // For brevity in this test snippet, assume inputs are accessible or you can refactor screen to have testIDs.
//   });
// });


import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// Mocks
jest.mock('@/config/index', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('components/Navbar', () => () => null);
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, loading: false, login: jest.fn() }),
}));
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Picker = ({ testID, onValueChange, children }) => (
    <Text testID={testID} onPress={() => onValueChange('2')}>
      {children}
    </Text>
  );
  Picker.Item = ({ label }) => <Text>{label}</Text>;
  return { Picker };
});

import API from '@/config/index';
import RegistrationScreen from '../app/(tabs)/auth/RegisterScreen';

describe('RegistrationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows referral field when agent selected', async () => {
    // mock registration statuses
    API.get.mockResolvedValue({
      data: { registrationStatus: [{ id: 1, name: 'customer' }, { id: 2, name: 'agent' }] },
    });
    const { getByTestId, getByPlaceholderText, queryByPlaceholderText } = render(<RegistrationScreen />);
    expect(queryByPlaceholderText(/Enter referral ID/i)).toBeNull();

    // wait for picker options to load
    await waitFor(() => {
      // no-op; just ensure effect resolved
      expect(API.get).toHaveBeenCalled();
    });

    fireEvent.press(getByTestId('reg_picker'));

    await waitFor(() => getByPlaceholderText(/Enter referral ID/i));
  });

  it('submits with required fields', async () => {
    API.get.mockResolvedValue({
      data: { registrationStatus: [{ id: 1, name: 'customer' }, { id: 2, name: 'agent' }] },
    });
    API.post.mockResolvedValueOnce({ data: { token: 'abcd' } });
    // mock alert to avoid environment issues
    global.alert = jest.fn();

    const { getByPlaceholderText, getByTestId } = render(<RegistrationScreen />);

    // wait for async load
    await waitFor(() => expect(API.get).toHaveBeenCalled());

    fireEvent.changeText(getByPlaceholderText(/enter surname/i), 'Doe');
    fireEvent.changeText(getByPlaceholderText(/enter firstname/i), 'John');
    fireEvent.changeText(getByPlaceholderText(/enter email/i), 'john@example.com');
    // Use a password that satisfies current validation: uppercase, lowercase, number, special, length >= 8
    fireEvent.changeText(getByTestId('password_input'), 'Abcd1234!');
    fireEvent.changeText(getByTestId('password_confirm_input'), 'Abcd1234!');

    fireEvent.press(getByTestId('submit_register'));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith('/register', expect.objectContaining({
        surname: 'Doe',
        firstname: 'John',
        email: 'john@example.com',
      }));
    });
  });
});
