import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { renderHook } from '@testing-library/react-hooks';

// Test component that uses the auth context
const TestComponent = () => {
  const { currentUser, login, logout, error } = useAuth();
  return (
    <div>
      <div data-testid="user">{currentUser ? JSON.stringify(currentUser) : 'No user'}</div>
      <div data-testid="error">{error}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should provide auth context to children', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
  });

  it('should handle login successfully', async () => {
    const mockUser = { id: 1, email: 'test@example.com', username: 'testuser' };
    const mockToken = 'mock-token';

    // Mock successful login response
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: mockToken, user: mockUser }),
      })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click login button
    await userEvent.click(screen.getByText('Login'));

    // Verify localStorage was updated
    expect(localStorage.setItem).toHaveBeenCalledWith('authToken', mockToken);
    expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));

    // Verify user state was updated
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    });
  });

  it('should handle login failure', async () => {
    // Mock failed login response
    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click login button
    await userEvent.click(screen.getByText('Login'));

    // Verify error state was updated
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
    });
  });

  it('should handle logout', async () => {
    // Set up initial logged in state
    const mockUser = { id: 1, email: 'test@example.com', username: 'testuser' };
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('authToken', 'mock-token');

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Click logout button
    await userEvent.click(screen.getByText('Logout'));

    // Verify localStorage was cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith('authToken');
    expect(localStorage.removeItem).toHaveBeenCalledWith('user');

    // Verify user state was cleared
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });
  });

  test('login success', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.login).toBeDefined();
    });

    const loginResult = await result.current.login('test@example.com', 'password123');
    expect(loginResult.success).toBe(true);
  });

  test('login failure', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.login).toBeDefined();
    });

    const loginResult = await result.current.login('test@example.com', 'wrongpassword');
    expect(loginResult.success).toBe(false);
  });

  test('register success', async () => {
    const { result } = renderHook(() => useAuth());
    
    await waitFor(() => {
      expect(result.current.register).toBeDefined();
    });

    const registerResult = await result.current.register(
      'newuser@example.com',
      'newuser',
      'password123',
      25
    );
    expect(registerResult.success).toBe(true);
  });
}); 