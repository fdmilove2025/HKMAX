import React, { createContext, useState, useEffect, useContext, useCallback } from "react";

// API base URL - adjust if needed
const API_URL = "http://localhost:5001";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Function to get the auth token from localStorage
  const getToken = () => {
    return localStorage.getItem("token");
  };

  // Function to set the auth token in localStorage
  const setAuthToken = (newToken) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem("token");
      setToken(null);
    }
  };

  // Function to remove the auth token from localStorage
  const removeToken = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setToken(null);
  };

  // Function to get auth headers
  const getAuthHeaders = () => {
    const token = getToken();
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  // Function to update current user
  const updateCurrentUser = (user) => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
    setCurrentUser(user);
  };

  // Function to get current user from localStorage
  const getCurrentUser = () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  // Function to make authenticated requests
  const makeAuthenticatedRequest = async (
    endpoint,
    method = "GET",
    body = null
  ) => {
    const url = `${API_URL}${endpoint}`;
    console.log(`Making ${method} request to:`, url);
    console.log("Request headers:", getAuthHeaders());

    const options = {
      method,
      headers: getAuthHeaders(),
      credentials: "include",
    };

    if (body) {
      options.body = JSON.stringify(body);
      console.log("Request body:", body);
    }

    try {
      console.log("Sending request with options:", options);
      const response = await fetch(url, options);
      console.log("Response status:", response.status);
      console.log(
        "Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Received non-JSON response:", text);
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();
      console.log("Response data:", data);

      // For login endpoint, don't throw error for 2FA responses
      if (endpoint === "/api/auth/login" && data['2fa_required']) {
        return data;
      }

      // For other endpoints or non-2FA responses, check for errors
      if (!response.ok) {
        throw new Error(data.error || data.message || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("Request error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      fetchCurrentUser();
    }
  }, [fetchCurrentUser]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/auth/user', 'GET');
      setCurrentUser(response.user);
    } catch (err) {
      removeToken();
    }
  }, [makeAuthenticatedRequest]);

  const register = async (email, username, password, age, faceid = false) => {
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          username,
          password,
          age,
          faceid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setAuthToken(data.access_token);
      setCurrentUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const login = async (email, password) => {
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.twofa_required) {
        return {
          success: false,
          twofa_required: true,
          temp_access_token: data.temp_access_token,
          message: data.message
        };
      }

      setAuthToken(data.access_token);
      setCurrentUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const verify2FA = async (token, tempAccessToken) => {
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempAccessToken}`,
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify 2FA token.');
      }

      // Set the final access token
      setAuthToken(data.access_token);

      // Get user data with the new token
      const userResponse = await fetch(`${API_URL}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user data');
      }

      const userData = await userResponse.json();
      updateCurrentUser(userData.user);

      return { success: true };
    } catch (err) {
      console.error("2FA verification error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const facialLogin = async (email, imageData) => {
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/auth/verify-face`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          image: imageData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Facial verification failed');
      }

      setAuthToken(data.access_token);
      setCurrentUser(data.user);
      return { success: true };
    } catch (err) {
      console.error("Facial login error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const registerFace = async (imageData) => {
    setError("");
    try {
      const data = await makeAuthenticatedRequest(
        "/api/auth/register-face",
        "POST",
        {
          image: imageData,
        }
      );

      // Update current user with has_faceid
      updateCurrentUser((prev) => ({
        ...prev,
        has_faceid: true,
      }));

      return { success: true, data };
    } catch (err) {
      console.error("Face registration error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    removeToken();
  };

  const value = {
    currentUser,
    token,
    error,
    loading,
    login,
    logout,
    register,
    updateCurrentUser,
    verify2FA,
    facialLogin,
    registerFace,
    isAuthenticated: !!token,
    makeAuthenticatedRequest,
    getAuthHeaders,
    getCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
