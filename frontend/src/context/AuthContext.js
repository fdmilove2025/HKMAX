import React, { createContext, useState, useEffect, useContext } from "react";

// API base URL - adjust if needed
const API_URL = "http://localhost:5001";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Function to get the auth token from localStorage
  const getToken = () => {
    return localStorage.getItem("authToken");
  };

  // Function to set the auth token in localStorage
  const setToken = (token) => {
    localStorage.setItem("authToken", token);
  };

  // Function to remove the auth token from localStorage
  const removeToken = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setCurrentUser(null);
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
    // Check if the user is logged in on page load
    const checkUser = async () => {
      const token = getToken();
      const user = getCurrentUser();
      
      if (!token || !user) {
        setLoading(false);
        return;
      }

      try {
        const data = await makeAuthenticatedRequest("/api/auth/user");
        updateCurrentUser(data.user);
      } catch (err) {
        console.error("Failed to retrieve user:", err);
        removeToken();
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const register = async (email, username, password, age, faceid) => {
    setError("");
    try {
      const data = await makeAuthenticatedRequest(
        "/api/auth/register",
        "POST",
        {
          email,
          username,
          password,
          age,
          faceid,
        }
      );

      setToken(data.access_token);
      updateCurrentUser(data.user);
      return { success: true, data };
    } catch (err) {
      console.error("Registration error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const login = async (email, password) => {
    setError("");
    try {
      const data = await makeAuthenticatedRequest("/api/auth/login", "POST", {
        email,
        password,
      });

      console.log("Login response data:", data);
      console.log('typeof data.2fa_required:', typeof data['2fa_required'], 'value:', data['2fa_required']);

      // Check for 2FA requirement first
      if (data['2fa_required']) {
        console.log("2FA required, returning 2FA info");
        return {
          success: false,
          twofa_required: true,
          temp_access_token: data.temp_access_token,
          message: data.message || "Please enter your 2FA code"
        };
      }

      // If we have an access token, login was successful
      if (data.access_token) {
        console.log("Login successful, setting token and user");
        setToken(data.access_token);
        updateCurrentUser(data.user);
        return { success: true };
      }

      // If we get here, something went wrong
      console.log("Login failed, no token or 2FA");
      return { success: false, error: data.error || "Login failed" };
    } catch (err) {
      console.error("Login error:", err);
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
      setToken(data.access_token);

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
      const data = await makeAuthenticatedRequest(
        "/api/auth/verify-face",
        "POST",
        {
          email,
          image: imageData,
        }
      );

      setToken(data.access_token);
      updateCurrentUser(data.user);
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
    loading,
    error,
    register,
    login,
    logout,
    verify2FA,
    registerFace,
    makeAuthenticatedRequest,
    getAuthHeaders,
    updateCurrentUser,
    getCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
