import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../../context/AuthContext';
import ProfilePage from '../ProfilePage';

// Mock the useTheme hook
jest.mock('../../context/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    toggleTheme: jest.fn(),
  }),
}));

describe('ProfilePage', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    is_two_factor_enabled: false,
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();

    // Mock successful user data fetch
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: mockUser }),
      })
    );
  });

  it('should render profile page with user data', async () => {
    render(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    );

    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });
  });

  it('should handle profile update', async () => {
    // Mock successful profile update
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { ...mockUser, username: 'newusername' } }),
      })
    );

    render(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    });

    // Update username
    const usernameInput = screen.getByDisplayValue('testuser');
    await act(async () => {
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, 'newusername');
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /update profile/i });
    await act(async () => {
      await userEvent.click(submitButton);
    });

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully!')).toBeInTheDocument();
    });
  });

  it('should handle 2FA enable flow', async () => {
    // Mock successful 2FA generation
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ qr_code: 'mock-qr-code' }),
      })
    );

    // Mock successful 2FA verification
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { ...mockUser, is_two_factor_enabled: true } }),
      })
    );

    render(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('testuser')).toBeInTheDocument();
    });

    // Click enable 2FA button
    const enable2FAButton = screen.getByRole('button', { name: /enable 2fa/i });
    await act(async () => {
      await userEvent.click(enable2FAButton);
    });

    // Verify QR code modal is shown
    await waitFor(() => {
      expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    });

    // Enter 2FA token
    const tokenInput = screen.getByPlaceholderText(/enter 2fa token/i);
    await act(async () => {
      await userEvent.type(tokenInput, '123456');
    });

    // Submit 2FA verification
    const verifyButton = screen.getByRole('button', { name: /verify/i });
    await act(async () => {
      await userEvent.click(verifyButton);
    });

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('2FA enabled successfully!')).toBeInTheDocument();
    });
  });

  it('should handle 2FA disable flow', async () => {
    // Set up initial state with 2FA enabled
    const userWith2FA = { ...mockUser, is_two_factor_enabled: true };
    localStorage.setItem('user', JSON.stringify(userWith2FA));

    // Mock successful 2FA disable
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { ...mockUser, is_two_factor_enabled: false } }),
      })
    );

    render(
      <AuthProvider>
        <ProfilePage />
      </AuthProvider>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText(/2fa is currently enabled/i)).toBeInTheDocument();
    });

    // Enter password
    const passwordInput = screen.getByPlaceholderText(/current password/i);
    await act(async () => {
      await userEvent.type(passwordInput, 'password123');
    });

    // Click disable 2FA button
    const disable2FAButton = screen.getByRole('button', { name: /disable 2fa/i });
    await act(async () => {
      await userEvent.click(disable2FAButton);
    });

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText('2FA disabled successfully!')).toBeInTheDocument();
    });
  });

  test('updates profile successfully', async () => {
    const { getByLabelText, getByText } = render(<ProfilePage />);
    
    // Wait for the form to be ready
    await waitFor(() => {
      expect(getByLabelText('Username')).toBeInTheDocument();
    });

    // Fill in the form
    await userEvent.type(getByLabelText('Username'), 'newusername');
    await userEvent.type(getByLabelText('Email'), 'newemail@example.com');
    await userEvent.type(getByLabelText('Current Password'), 'password123');
    await userEvent.type(getByLabelText('New Password'), 'newpassword123');

    // Submit the form
    await userEvent.click(getByText('Update Profile'));

    // Wait for success message
    await waitFor(() => {
      expect(getByText('Profile updated successfully')).toBeInTheDocument();
    });
  });

  test('handles profile update error', async () => {
    const { getByLabelText, getByText } = render(<ProfilePage />);
    
    // Wait for the form to be ready
    await waitFor(() => {
      expect(getByLabelText('Username')).toBeInTheDocument();
    });

    // Fill in the form with invalid data
    await userEvent.type(getByLabelText('Username'), 'newusername');
    await userEvent.type(getByLabelText('Email'), 'invalid-email');
    await userEvent.type(getByLabelText('Current Password'), 'wrongpassword');

    // Submit the form
    await userEvent.click(getByText('Update Profile'));

    // Wait for error message
    await waitFor(() => {
      expect(getByText('Invalid email format')).toBeInTheDocument();
    });
  });
}); 