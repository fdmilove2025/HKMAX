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
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await makeAuthenticatedRequest("/api/auth/user");
        setCurrentUser(data.user);
      } catch (err) {
        console.error("Failed to retrieve user:", err);
        removeToken();
        setCurrentUser(null);
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
      setCurrentUser(data.user);
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

      setToken(data.access_token);
      setCurrentUser(data.user);
      return { success: true };
    } catch (err) {
      console.error("Login error:", err);
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
      setCurrentUser((prev) => ({
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
    setCurrentUser(null);
    return { success: true };
  };

  const value = {
    currentUser,
    loading,
    error,
    register,
    login,
    facialLogin,
    registerFace,
    logout,
    getAuthHeaders,
    makeAuthenticatedRequest,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
