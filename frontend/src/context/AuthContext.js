import React, { createContext, useState, useEffect, useContext } from 'react';

// API base URL - adjust if needed
const API_URL = 'http://localhost:5001';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to get the auth token from localStorage
  const getToken = () => {
    return localStorage.getItem('authToken');
  };

  // Function to set the auth token in localStorage
  const setToken = (token) => {
    localStorage.setItem('authToken', token);
  };

  // Function to remove the auth token from localStorage
  const removeToken = () => {
    localStorage.removeItem('authToken');
  };

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  };

  useEffect(() => {
    // Check if the user is logged in on page load
    const checkUser = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/auth/user`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        } else {
          // If token is invalid, clear it
          removeToken();
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Failed to retrieve user:', err);
        removeToken();
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const register = async (email, username, password, age) => {
    setError('');
    try {
      console.log('Registering with:', { email, username, password, age });

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, username, password, age }),
      });

      // Log response details for debugging
      console.log('Registration response status:', response.status);

      // For non-JSON responses, we need special handling
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Received non-JSON response:', text);
        throw new Error(`Server responded with non-JSON content: ${text.substring(0, 100)}...`);
      }

      console.log('Registration response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store the token and user data
      setToken(data.access_token);
      setCurrentUser(data.user);

      return { success: true, data };
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const login = async (email, password) => {
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      // For non-JSON responses, we need special handling
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Received non-JSON response:', text);
        throw new Error(`Server responded with non-JSON content: ${text.substring(0, 100)}...`);
      }

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store the token and user data
      setToken(data.access_token);
      setCurrentUser(data.user);

      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    removeToken();
    setCurrentUser(null);
    return { success: true };
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    logout,
    getAuthHeaders, // Export this function for use in API calls
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 